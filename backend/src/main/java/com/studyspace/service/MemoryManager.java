package com.studyspace.service;

import com.studyspace.entity.Conversation;
import com.studyspace.entity.Conversation.ChatMessage;
import com.studyspace.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Core orchestrator for the Hybrid Memory System.
 *
 * <p><strong>Architecture phases implemented here:</strong>
 * <ul>
 *   <li><strong>Phase 1</strong> — Session lifecycle: load or create a {@link Conversation} by its UUID.</li>
 *   <li><strong>Phase 2</strong> — Recent message buffer: inject the short-term buffer into every prompt.</li>
 *   <li><strong>Phase 3</strong> — Rolling summary: when the buffer exceeds {@link #MAX_RECENT_MESSAGES},
 *       the oldest half is folded into the long-term summary via a separate Gemini call, then evicted.</li>
 * </ul>
 *
 * <p>Every logical step is individually logged so the full memory pipeline is
 * traceable in the application logs without needing a debugger.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MemoryManager {

    // ─── Configuration ───────────────────────────────────────────────────────

    /** Maximum number of raw messages to keep in the short-term buffer before compression. */
    static final int MAX_RECENT_MESSAGES = 4;

    /**
     * When the buffer overflows, we summarise the oldest {@code MESSAGES_TO_SUMMARISE}
     * messages and keep the newest {@code (MAX_RECENT_MESSAGES - MESSAGES_TO_SUMMARISE)}.
     */
    static final int MESSAGES_TO_SUMMARISE = MAX_RECENT_MESSAGES / 2; // 5

    // ─── Dependencies ────────────────────────────────────────────────────────

    private final ConversationRepository conversationRepository;
    private final PromptBuilder promptBuilder;
    private final GeminiService geminiService;

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Full pipeline for one user turn:
     * <ol>
     *   <li>Load (or create) the conversation from the DB.</li>
     *   <li>Build the runtime prompt with summary + recent buffer + document context.</li>
     *   <li>Call Gemini to get the assistant response.</li>
     *   <li>Append both user message and assistant response to the buffer.</li>
     *   <li>If the buffer exceeds the threshold, compress older messages.</li>
     *   <li>Persist the updated conversation state.</li>
     * </ol>
     *
     * @param conversationId  client-generated UUID; if blank, a stateless call is made
     * @param userQuestion    the student's question
     * @param documentContext extracted document text (may be blank)
     * @return Gemini's answer
     */
    @Transactional
    public String handleQuery(String conversationId, String userQuestion, String documentContext) {

        boolean stateless = (conversationId == null || conversationId.isBlank());
        log.info("[MEMORY] handleQuery() — conversationId={}, stateless={}, questionLength={}",
                stateless ? "<none>" : conversationId, stateless, userQuestion.length());

        // ── Phase 1: Load or create conversation ────────────────────────────
        Conversation conv = null;
        if (!stateless) {
            conv = loadOrCreate(conversationId);
        }

        String summary = conv != null ? conv.getSummary() : "";
        List<ChatMessage> recentMessages = conv != null ? conv.getRecentMessages() : List.of();

        log.info("[MEMORY] Memory state loaded — summaryLength={}, recentCount={}",
                summary != null ? summary.length() : 0, recentMessages.size());

        // ── Phase 2: Build prompt with recent message buffer ─────────────────
        String prompt = promptBuilder.buildRuntimePrompt(summary, recentMessages, documentContext, userQuestion);

        // ── Gemini call — main response ──────────────────────────────────────
        log.info("[MEMORY] Calling Gemini for main response...");
        String answer = geminiService.generate(prompt);
        log.info("[MEMORY] Gemini answered — answerLength={}", answer != null ? answer.length() : 0);

        // ── If stateless, we are done — nothing to persist ───────────────────
        if (stateless) {
            log.info("[MEMORY] Stateless mode — skipping memory persistence");
            return answer;
        }

        // ── Append both turns to the buffer ─────────────────────────────────
        String nowIso = Instant.now().toString();
        List<ChatMessage> buffer = new ArrayList<>(conv.getRecentMessages());
        buffer.add(ChatMessage.builder().role("user").content(userQuestion).timestamp(nowIso).build());
        buffer.add(ChatMessage.builder().role("assistant").content(answer).timestamp(nowIso).build());
        log.debug("[MEMORY] Buffer after append — size={}", buffer.size());

        // ── Phase 3: Rolling summary compression if threshold exceeded ────────
        if (buffer.size() > MAX_RECENT_MESSAGES) {
            log.info("[MEMORY] Buffer overflow ({} > {}) — triggering compression",
                    buffer.size(), MAX_RECENT_MESSAGES);
            SummarisationResult result = compress(conv.getSummary(), buffer);
            conv.setSummary(result.newSummary);  // update long-term summary on the entity
            buffer = new ArrayList<>(result);     // copy trimmed entries into a plain List
        }

        // ── Persist ──────────────────────────────────────────────────────────
        conv.setRecentMessages(buffer);
        conversationRepository.save(conv);
        log.info("[MEMORY] Conversation persisted — id={}, bufferSize={}, summaryLength={}",
                conv.getId(), buffer.size(), conv.getSummary() != null ? conv.getSummary().length() : 0);

        return answer;
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Fetches the conversation by ID or creates a new empty one if it does not exist yet.
     *
     * @param conversationId UUID string from the client
     * @return existing or newly created {@link Conversation}
     */
    private Conversation loadOrCreate(String conversationId) {
        return conversationRepository.findById(conversationId).orElseGet(() -> {
            log.info("[MEMORY] No existing conversation found for id={} — creating new", conversationId);
            Conversation newConv = Conversation.builder()
                    .id(conversationId)
                    .summary("")
                    .recentMessages(new ArrayList<>())
                    .build();
            return conversationRepository.save(newConv);
        });
    }

    /**
     * Phase 3 compression: summarises the oldest {@link #MESSAGES_TO_SUMMARISE} messages
     * via a separate Gemini call, updates {@code conv.summary}, and returns a trimmed buffer
     * containing only the newest messages.
     *
     * <p>The compression is designed so that the newest messages are <em>always</em>
     * kept raw (Rule 1 from the memory design document).
     *
     * @param currentSummary  existing long-term summary
     * @param fullBuffer      full buffer that exceeded the threshold
     * @return trimmed buffer after compression
     */
    private SummarisationResult compress(String currentSummary, List<ChatMessage> fullBuffer) {
        List<ChatMessage> toSummarise = fullBuffer.subList(0, MESSAGES_TO_SUMMARISE);
        List<ChatMessage> toKeep      = fullBuffer.subList(MESSAGES_TO_SUMMARISE, fullBuffer.size());

        log.info("[MEMORY] Compression: summarising {} messages, keeping {} raw",
                toSummarise.size(), toKeep.size());

        String summaryPrompt = promptBuilder.buildSummarisationPrompt(currentSummary, toSummarise);

        log.info("[MEMORY] Calling Gemini for summary update...");
        String newSummary = geminiService.generateSummary(summaryPrompt);
        log.info("[MEMORY] Summary updated — newSummaryLength={}",
                newSummary != null ? newSummary.length() : 0);

        return new SummarisationResult(newSummary, new ArrayList<>(toKeep));
    }

    // ─── Inner result carrier ─────────────────────────────────────────────────

    /**
     * Carries both the trimmed buffer AND the new summary out of {@link #compress}.
     * Extends ArrayList so the caller can use it as a List while also reading the summary.
     */
    static class SummarisationResult extends ArrayList<ChatMessage> {
        final String newSummary;

        SummarisationResult(String newSummary, List<ChatMessage> trimmedBuffer) {
            super(trimmedBuffer);
            this.newSummary = newSummary;
        }
    }
}
