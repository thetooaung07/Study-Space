package com.studyspace.service;

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

import java.util.ArrayList;
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
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MemoryManager {

    /** Trigger async compression when a conversation has more than this many messages. */
    static final int COMPRESSION_THRESHOLD = 2;

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
     *   <li>Build a prompt with summary + recent buffer + RAG chunks + question.</li>
     *   <li>Resolve the requested LLM provider and generate the answer.</li>
     *   <li>Persist user and assistant {@link Message} rows.</li>
     *   <li>If the message count exceeds the threshold, trigger async compression.</li>
     * </ol>
     *
     * @param conversationId client-generated UUID; if blank, call is stateless (no memory)
     * @param userQuestion   the student's question
     * @param ragChunks      relevant document excerpts returned by {@link DocumentVectorService}
     * @param providerName   {@code "gemini"} or {@code "openai"} (defaults to Gemini)
     * @return the assistant's answer
     */
    @Transactional
    public String handleQuery(String conversationId,
                              String userQuestion,
                              List<String> ragChunks,
                              String providerName) {

        boolean stateless = (conversationId == null || conversationId.isBlank());
        log.info("[MEMORY] handleQuery() — conversationId={}, stateless={}, provider={}, questionLength={}",
                stateless ? "<none>" : conversationId, stateless, providerName, userQuestion.length());

        // ── Phase 1: Load or create conversation ────────────────────────────
        Conversation conv = null;
        if (!stateless) {
            conv = loadOrCreate(conversationId);
        }

        String summary = conv != null ? conv.getSummary() : "";
        List<Message> recentMessages = conv != null
                ? messageRepository.findTop10ByConversationIdOrderByCreatedAtAsc(conv.getId())
                : List.of();

        log.info("[MEMORY] Memory loaded — summaryLength={}, recentMessages={}, ragChunks={}",
                summary.length(), recentMessages.size(), ragChunks != null ? ragChunks.size() : 0);

        // ── Phase 2 + 4: Build prompt ───────────────────────────────────────
        String prompt = promptBuilder.buildRuntimePrompt(summary, recentMessages,
                ragChunks != null ? ragChunks : List.of(), userQuestion);

        // ── Phase 5: Resolve provider and generate ──────────────────────────
        LlmProvider provider = llmProviderRegistry.resolve(providerName);
        log.info("[MEMORY] Using provider: {}", provider.providerName());
        String answer = provider.generate(prompt);
        log.info("[MEMORY] Answer generated — {} chars", answer != null ? answer.length() : 0);

        // ── Stateless: skip persistence ──────────────────────────────────────
        if (stateless) {
            log.info("[MEMORY] Stateless mode — skipping persistence");
            return answer;
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

        return answer;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private Conversation loadOrCreate(String conversationId) {
        return conversationRepository.findById(conversationId).orElseGet(() -> {
            log.info("[MEMORY] No conversation found for id={} — creating new", conversationId);
            return conversationRepository.save(
                    Conversation.builder()
                            .id(conversationId)
                            .summary("")
                            .build()
            );
        });
    }
}
