package com.studyspace.service;

import com.studyspace.entity.Conversation.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Assembles the full runtime prompt that is sent to Gemini for each user turn.
 *
 * <p>Prompt structure (Phase 2 — Recent Message Buffer):
 * <pre>
 *   [SYSTEM INSTRUCTIONS]
 *   [Long-term summary   — if present]
 *   [Recent conversation — if any]
 *   [Document context    — if a file was tagged]
 *   [Current user question]
 * </pre>
 *
 * <p>Separating prompt construction here makes it easy to tune, test and
 * debug without touching LLM-calling code in {@link GeminiService}.
 */
@Service
@Slf4j
public class PromptBuilder {

    private static final int MAX_CONTEXT_CHARS = 10_000;

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Builds the runtime prompt.
     *
     * @param summary        rolling long-term summary (may be blank)
     * @param recentMessages short-term message buffer (may be empty)
     * @param documentContext extracted PDF text (may be blank)
     * @param userQuestion   current question from the student
     * @return complete prompt string ready to send to Gemini
     */
    public String buildRuntimePrompt(
            String summary,
            List<ChatMessage> recentMessages,
            String documentContext,
            String userQuestion) {

        StringBuilder sb = new StringBuilder();

        // ── System preamble ─────────────────────────────────────────────────
        sb.append("You are a helpful academic teaching assistant for students using the StudySpace platform.\n");
        sb.append("Answer clearly, concisely, and in Markdown where appropriate.\n\n");

        // ── Long-term summary (Phase 3) ──────────────────────────────────────
        if (summary != null && !summary.isBlank()) {
            sb.append("## Conversation Summary (long-term memory)\n");
            sb.append(summary.trim()).append("\n\n");
            log.debug("[PROMPT_BUILDER] Injected long-term summary ({} chars)", summary.length());
        }

        // ── Recent message buffer (Phase 2) ─────────────────────────────────
        if (recentMessages != null && !recentMessages.isEmpty()) {
            sb.append("## Recent Conversation\n");
            for (ChatMessage msg : recentMessages) {
                String label = "user".equalsIgnoreCase(msg.getRole()) ? "Student" : "Assistant";
                sb.append(label).append(": ").append(msg.getContent()).append("\n");
            }
            sb.append("\n");
            log.debug("[PROMPT_BUILDER] Injected {} recent messages", recentMessages.size());
        }

        // ── Document context ─────────────────────────────────────────────────
        if (documentContext != null && !documentContext.isBlank()) {
            sb.append("## Document Context\n");
            sb.append("Use the following extracted document text to answer the student's question. ");
            sb.append("Only rely on it if relevant; otherwise answer from your general knowledge.\n\n");
            String safeCtx = documentContext.length() > MAX_CONTEXT_CHARS
                    ? documentContext.substring(0, MAX_CONTEXT_CHARS) + "\n[...document truncated...]"
                    : documentContext;
            sb.append(safeCtx).append("\n\n");
            log.debug("[PROMPT_BUILDER] Injected document context ({} chars, truncated={})",
                    safeCtx.length(), documentContext.length() > MAX_CONTEXT_CHARS);
        }

        // ── Current user question ────────────────────────────────────────────
        sb.append("## Student's Current Question\n");
        sb.append(userQuestion.trim());

        String prompt = sb.toString();
        log.info("[PROMPT_BUILDER] Final prompt assembled — {} chars total, summary={}, recentMsgs={}, hasDoc={}",
                prompt.length(),
                summary != null && !summary.isBlank(),
                recentMessages != null ? recentMessages.size() : 0,
                documentContext != null && !documentContext.isBlank());

        return prompt;
    }

    // ─── Summarisation prompt ────────────────────────────────────────────────

    /**
     * Builds a separate summarisation prompt used to update the long-term rolling summary.
     * This is intentionally a different prompt from the runtime prompt to keep
     * summarisation behaviour predictable and independently debuggable.
     *
     * @param oldSummary     existing summary (may be blank for the first compression)
     * @param messagesToSummarise messages that are about to be evicted from the buffer
     * @return prompt to send to Gemini for a summary update
     */
    public String buildSummarisationPrompt(String oldSummary, List<ChatMessage> messagesToSummarise) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are a memory compression assistant.\n");
        sb.append("Update the long-term conversation summary by incorporating the new conversation.\n\n");

        if (oldSummary != null && !oldSummary.isBlank()) {
            sb.append("## Existing Summary\n").append(oldSummary.trim()).append("\n\n");
        } else {
            sb.append("## Existing Summary\n(none — this is the first compression)\n\n");
        }

        sb.append("## New Conversation to Incorporate\n");
        for (ChatMessage msg : messagesToSummarise) {
            String label = "user".equalsIgnoreCase(msg.getRole()) ? "Student" : "Assistant";
            sb.append(label).append(": ").append(msg.getContent()).append("\n");
        }

        sb.append("\n## Instructions\n");
        sb.append("Write an updated long-term summary that preserves:\n");
        sb.append("- User goals and ongoing projects\n");
        sb.append("- Key decisions and preferences\n");
        sb.append("- Important technical context\n");
        sb.append("- Unresolved questions\n\n");
        sb.append("Keep the summary factual, concise (under 400 words), and in plain prose. ");
        sb.append("Do NOT replay the conversation verbatim. Output only the updated summary.\n");

        log.info("[PROMPT_BUILDER] Summarisation prompt built — {} messages to fold, existingSummary={}",
                messagesToSummarise.size(), oldSummary != null && !oldSummary.isBlank());
        return sb.toString();
    }
}
