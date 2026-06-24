package com.studyspace.service;

import com.studyspace.dto.ChatQueryResponse;
import com.studyspace.entity.Conversation;
import com.studyspace.entity.Message;
import com.studyspace.repository.ConversationRepository;
import com.studyspace.repository.MessageRepository;
import com.studyspace.service.llm.LlmProvider;
import com.studyspace.service.llm.LlmProviderRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Core orchestrator for the Hybrid Memory System.
 *
 * <h3>Architecture phases</h3>
 * <ul>
 *   <li><strong>Phase 1</strong> — Session lifecycle: load or create a {@link Conversation}.</li>
 *   <li><strong>Phase 2</strong> — Recent message buffer: fetch the last 10 DB rows for context.</li>
 *   <li><strong>Phase 3</strong> — Rolling summary: async compression when buffer exceeds
 *       {@link #COMPRESSION_THRESHOLD}.</li>
 *   <li><strong>Phase 4</strong> — RAG context: top-K document chunks injected into the prompt.</li>
 *   <li><strong>Phase 5</strong> — Provider switch: Gemini or OpenAI resolved at call-time.</li>
 *   <li><strong>Phase 6</strong> — Auto-title: on the first turn of a new conversation the LLM
 *       prefixes its answer with {@code TITLE: <label>}; this method strips the prefix, persists
 *       the title to {@code conversations.title}, and returns the label in
 *       {@link ChatQueryResponse#getConversationTitle()} for the frontend History popup.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MemoryManager {

    /** Trigger async compression when a conversation has more than this many messages. */
    static final int COMPRESSION_THRESHOLD = 2;

    private static final String DEFAULT_TITLE   = "New Chat";
    private static final String TITLE_PREFIX    = "TITLE:";

    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;
    private final PromptBuilder          promptBuilder;
    private final LlmProviderRegistry    llmProviderRegistry;
    private final AsyncMemoryCompressor  asyncMemoryCompressor;

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Full pipeline for one user turn.
     *
     * <ol>
     *   <li>Load (or create) the conversation from the DB.</li>
     *   <li>Fetch the last 10 messages for recent context.</li>
     *   <li>Build a prompt with summary + recent buffer + RAG chunks + question.
     *       On the first turn of a new conversation, a {@code TITLE:} instruction is injected.</li>
     *   <li>Resolve the requested LLM provider and generate the answer.</li>
     *   <li>If the answer starts with {@code TITLE:}, extract the label, persist it to the
     *       conversation, and strip the prefix so only the clean answer is saved and returned.</li>
     *   <li>Persist user and assistant {@link Message} rows.</li>
     *   <li>If the message count exceeds the threshold, trigger async compression.</li>
     * </ol>
     *
     * @param conversationId client-generated UUID; if blank, call is stateless (no memory)
     * @param userId         owner of the conversation (required when conversationId is present)
     * @param userQuestion   the student's question
     * @param ragChunks      relevant document excerpts returned by {@link DocumentVectorService}
     * @param providerName   {@code "gemini"} or {@code "openai"} (defaults to Gemini)
     * @param contextDocumentTitle human-readable title of the tagged document (may be null)
     * @return {@link ChatQueryResponse} containing the clean answer, optional doc title,
     *         and optional generated conversation title (non-null on first turn only)
     */
    @Transactional
    public ChatQueryResponse handleQuery(String conversationId,
                                         Long   userId,
                                         String userQuestion,
                                         List<String> ragChunks,
                                         String providerName,
                                         String contextDocumentTitle) {

        boolean stateless = (conversationId == null || conversationId.isBlank());
        log.info("[MEMORY] handleQuery() — conversationId={}, userId={}, stateless={}, provider={}, questionLength={}",
                stateless ? "<none>" : conversationId, userId, stateless, providerName, userQuestion.length());

        // ── Phase 1: Load or create conversation ────────────────────────────
        Conversation conv = null;
        boolean firstTurn = false;

        if (!stateless) {
            conv = loadOrCreate(conversationId, userId);
            firstTurn = DEFAULT_TITLE.equals(conv.getTitle());
        }

        String summary = conv != null ? conv.getSummary() : "";
        List<Message> recentMessages = conv != null
                ? messageRepository.findTop10ByConversationIdOrderByCreatedAtAsc(conv.getId())
                : List.of();

        log.info("[MEMORY] Memory loaded — summaryLength={}, recentMessages={}, ragChunks={}, firstTurn={}",
                summary.length(), recentMessages.size(),
                ragChunks != null ? ragChunks.size() : 0, firstTurn);

        // ── Phase 2 + 4: Build prompt ───────────────────────────────────────
        String prompt = promptBuilder.buildRuntimePrompt(
                summary,
                recentMessages,
                ragChunks != null ? ragChunks : List.of(),
                userQuestion,
                firstTurn);

        // ── Phase 5: Resolve provider and generate ──────────────────────────
        LlmProvider provider = llmProviderRegistry.resolve(providerName);
        log.info("[MEMORY] Using provider: {}", provider.providerName());
        String rawAnswer = provider.generate(prompt);
        log.info("[MEMORY] Raw answer generated — {} chars", rawAnswer != null ? rawAnswer.length() : 0);

        // ── Phase 6: Extract TITLE prefix on first turn ──────────────────────
        String generatedTitle = null;
        String answer = rawAnswer;

        if (firstTurn && rawAnswer != null && rawAnswer.startsWith(TITLE_PREFIX)) {
            int newlineIdx = rawAnswer.indexOf('\n');
            if (newlineIdx > TITLE_PREFIX.length()) {
                generatedTitle = rawAnswer.substring(TITLE_PREFIX.length(), newlineIdx).trim();
                // Strip the title line (and any immediately following blank line) from the answer
                answer = rawAnswer.substring(newlineIdx + 1).stripLeading();
                log.info("[MEMORY] Extracted conversation title: '{}'", generatedTitle);

                // Persist title to DB
                conv.setTitle(generatedTitle);
                conversationRepository.save(conv);
            }
        }

        // ── Stateless: skip persistence ──────────────────────────────────────
        if (stateless) {
            log.info("[MEMORY] Stateless mode — skipping persistence");
            return new ChatQueryResponse(answer, contextDocumentTitle, null);
        }

        // ── Persist both turns ──────────────────────────────────────────────
        messageRepository.save(Message.builder()
                .conversationId(conversationId)
                .role("user")
                .content(userQuestion)
                .build());
        messageRepository.save(Message.builder()
                .conversationId(conversationId)
                .role("assistant")
                .content(answer)
                .build());

        // ── Phase 3: Trigger async compression if needed ────────────────────
        long count = messageRepository.countByConversationId(conversationId);
        log.info("[MEMORY] Message count for {} = {}", conversationId, count);
        if (count > COMPRESSION_THRESHOLD) {
            log.info("[MEMORY] Threshold exceeded — scheduling async compression");
            asyncMemoryCompressor.compressMemoryAsync(conversationId);
        }

        return new ChatQueryResponse(answer, contextDocumentTitle, generatedTitle);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Conversation loadOrCreate(String conversationId, Long userId) {
        return conversationRepository.findById(conversationId).orElseGet(() -> {
            log.info("[MEMORY] No conversation found for id={} — creating new (userId={})",
                    conversationId, userId);
            return conversationRepository.save(
                    Conversation.builder()
                            .id(conversationId)
                            .userId(userId)
                            .summary("")
                            .build()
            );
        });
    }
}
