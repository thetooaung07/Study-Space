package com.studyspace.service;

import com.studyspace.entity.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Assembles the full runtime prompt sent to the LLM for each user turn.
 *
 * <p>Prompt structure:
 * <pre>
 *   [SYSTEM INSTRUCTIONS]
 *   [Long-term summary     — if present]
 *   [Recent conversation   — last N messages from DB]
 *   [Relevant RAG excerpts — top-K chunks from document_chunks]
 *   [Current user question]
 * </pre>
 *
 * <p>Separating prompt construction here keeps LLM-calling code in
 * {@link com.studyspace.service.llm.LlmProvider} implementations free of
 * formatting logic, and makes prompt templates independently testable.
 */
@Service
@Slf4j
public class PromptBuilder {

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Builds the runtime prompt for a single user turn.
     *
     * @param summary        rolling long-term summary (may be blank)
     * @param recentMessages recent DB messages for this conversation (may be empty)
     * @param ragChunks      top-K semantically relevant document excerpts (may be empty)
     * @param userQuestion   the student's current question
     * @return complete prompt string ready to send to the LLM provider
     */
    public String buildRuntimePrompt(String summary,
                                     List<Message> recentMessages,
                                     List<String> ragChunks,
                                     String userQuestion) {
        StringBuilder sb = new StringBuilder();

        // ── System preamble ─────────────────────────────────────────────────
        sb.append("You are a helpful academic teaching assistant for students using the StudySpace platform.\n");
        sb.append("Answer clearly, concisely, and in Markdown where appropriate.\n\n");

        // ── Long-term summary ────────────────────────────────────────────────
        if (summary != null && !summary.isBlank()) {
            sb.append("## Conversation Summary (long-term memory)\n");
            sb.append(summary.trim()).append("\n\n");
            log.debug("[PROMPT_BUILDER] Injected long-term summary ({} chars)", summary.length());
        }

        // ── Recent message buffer ────────────────────────────────────────────
        if (recentMessages != null && !recentMessages.isEmpty()) {
            sb.append("## Recent Conversation\n");
            for (Message msg : recentMessages) {
                String label = "user".equalsIgnoreCase(msg.getRole()) ? "Student" : "Assistant";
                sb.append(label).append(": ").append(msg.getContent()).append("\n");
            }
            sb.append("\n");
            log.debug("[PROMPT_BUILDER] Injected {} recent messages", recentMessages.size());
        }

        // ── RAG document excerpts (replaces full-document injection) ─────────
        if (ragChunks != null && !ragChunks.isEmpty()) {
            sb.append("## Relevant Document Excerpts\n");
            sb.append("The following excerpts were retrieved from the tagged Course Material. ");
            sb.append("Use them to inform your answer where relevant.\n\n");
            for (int i = 0; i < ragChunks.size(); i++) {
                sb.append("### Excerpt ").append(i + 1).append("\n");
                sb.append(ragChunks.get(i).trim()).append("\n\n");
            }
            log.debug("[PROMPT_BUILDER] Injected {} RAG chunks", ragChunks.size());
        }

        // ── Current question ─────────────────────────────────────────────────
        sb.append("## Student's Current Question\n");
        sb.append(userQuestion.trim());

        String prompt = sb.toString();
        log.info("[PROMPT_BUILDER] Prompt assembled — {} chars | summary={} | recentMsgs={} | ragChunks={}",
                prompt.length(),
                summary != null && !summary.isBlank(),
                recentMessages != null ? recentMessages.size() : 0,
                ragChunks != null ? ragChunks.size() : 0);

        return prompt;
    }

    // ─── Summarisation prompt ────────────────────────────────────────────────

    /**
     * Builds a summarisation prompt for the async memory compressor.
     * Accepts raw {@code [role, content]} pairs so it can be called from
     * {@link AsyncMemoryCompressor} without importing entity classes.
     *
     * @param oldSummary   existing rolling summary (may be blank on first compression)
     * @param messagePairs list of {@code [role, content]} arrays representing old messages
     * @return prompt to send to Gemini for a summary update
     */
    public String buildSummarisationPromptFromPairs(String oldSummary, List<String[]> messagePairs) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are a memory compression assistant.\n");
        sb.append("Update the long-term conversation summary by incorporating the new conversation.\n\n");

        if (oldSummary != null && !oldSummary.isBlank()) {
            sb.append("## Existing Summary\n").append(oldSummary.trim()).append("\n\n");
        } else {
            sb.append("## Existing Summary\n(none — this is the first compression)\n\n");
        }

        sb.append("## New Conversation to Incorporate\n");
        for (String[] pair : messagePairs) {
            String role    = pair[0];
            String content = pair[1];
            String label   = "user".equalsIgnoreCase(role) ? "Student" : "Assistant";
            sb.append(label).append(": ").append(content).append("\n");
        }

        sb.append("\n## Instructions\n");
        sb.append("Write an updated long-term summary that preserves:\n");
        sb.append("- User goals and ongoing projects\n");
        sb.append("- Key decisions and preferences\n");
        sb.append("- Important technical context\n");
        sb.append("- Unresolved questions\n\n");
        sb.append("Keep the summary factual, concise (under 400 words), and in plain prose. ");
        sb.append("Do NOT replay the conversation verbatim. Output only the updated summary.\n");

        log.info("[PROMPT_BUILDER] Summarisation prompt built — {} pairs, existingSummary={}",
                messagePairs.size(), oldSummary != null && !oldSummary.isBlank());
        return sb.toString();
    }

    /**
     * Convenience overload for callers that have a {@link List} of {@link Message} entities.
     *
     * @param oldSummary        existing rolling summary
     * @param messagesToSummarise messages to fold into the summary
     */
    public String buildSummarisationPrompt(String oldSummary, List<Message> messagesToSummarise) {
        List<String[]> pairs = messagesToSummarise.stream()
                .map(m -> new String[]{m.getRole(), m.getContent()})
                .toList();
        return buildSummarisationPromptFromPairs(oldSummary, pairs);
    }
}
