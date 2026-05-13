package com.studyspace.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Client service that communicates with Google's Gemini API using the official
 * Google GenAI Java SDK (com.google.genai:google-genai).
 *
 * <p><strong>Phase 1 refactor:</strong> The original {@code buildPrompt} helper has been
 * moved to {@link PromptBuilder}. This class is now responsible solely for
 * firing API calls and handling errors — keeping concerns separated.
 *
 * <p><strong>New in Phase 3:</strong> {@link #generateSummary(String)} sends a
 * separate Gemini call to compress old messages into a rolling summary.
 */
@Service
@Slf4j
public class GeminiService {

    private static final String MODEL = "gemini-3-flash-preview";

    private final Client client;

    public GeminiService(@Value("${gemini.api.key}") String apiKey) {
        this.client = new Client.Builder().apiKey(apiKey).build();
        log.info("[GEMINI] Service initialised — model: {}, key: {}", MODEL, maskKey(apiKey));
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Sends a fully assembled prompt to Gemini and returns the answer text.
     *
     * <p>This is the primary generation call used by {@link MemoryManager}.
     * The prompt is built externally by {@link PromptBuilder} so that
     * prompt logic can be unit-tested independently.
     *
     * @param prompt complete prompt string (system + memory + document + question)
     * @return Gemini's response as a plain string
     */
    public String generate(String prompt) {
        log.info("[GEMINI] generate() — prompt length: {} chars", prompt.length());
        return callApi(prompt, "generate");
    }

    /**
     * Sends a summarisation prompt to Gemini and returns the updated summary text.
     *
     * <p>This is a <em>separate</em> LLM call from {@link #generate}, keeping
     * summarisation independently debuggable (Phase 3).
     *
     * @param summarisationPrompt pre-built prompt from {@link PromptBuilder#buildSummarisationPrompt}
     * @return new summary text
     */
    public String generateSummary(String summarisationPrompt) {
        log.info("[GEMINI] generateSummary() — summarisation prompt length: {} chars",
                summarisationPrompt.length());
        return callApi(summarisationPrompt, "generateSummary");
    }

    /**
     * Legacy convenience method retained for backward compatibility.
     * New code should use {@link #generate(String)} via {@link MemoryManager}.
     *
     * @deprecated Use {@link MemoryManager#handleQuery} instead.
     */
    @Deprecated
    public String askGeminiWithContext(String context, String userQuestion) {
        log.warn("[GEMINI] askGeminiWithContext() called (legacy path) — prefer MemoryManager.handleQuery()");
        StringBuilder sb = new StringBuilder();
        sb.append("You are a helpful academic teaching assistant for students using the StudySpace platform.\n\n");
        if (context != null && !context.isBlank()) {
            sb.append("Use the following document content as context to answer the student's question. ");
            sb.append("Only rely on this context if it is relevant; otherwise answer from your general knowledge.\n\n");
            sb.append("--- DOCUMENT CONTEXT ---\n");
            String safeContext = context.length() > 10_000
                    ? context.substring(0, 10_000) + "\n[...document truncated...]"
                    : context;
            sb.append(safeContext);
            sb.append("\n--- END OF DOCUMENT CONTEXT ---\n\n");
        }
        sb.append("Student's question: ").append(userQuestion);
        return callApi(sb.toString(), "askGeminiWithContext(legacy)");
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Executes a single content-generation request to Gemini and handles errors.
     *
     * @param prompt  the full prompt string
     * @param caller  label used in log messages for tracing which path triggered the call
     */
    private String callApi(String prompt, String caller) {
        log.debug("[GEMINI][{}] Sending request to Gemini API (model={})...", caller, MODEL);
        try {
            GenerateContentResponse response = client.models.generateContent(MODEL, prompt, null);
            String answer = response.text();
            log.info("[GEMINI][{}] Response received — {} chars: '{}'",
                    caller,
                    answer != null ? answer.length() : 0,
                    answer != null && answer.length() > 200 ? answer.substring(0, 200) + "..." : answer);
            return answer;

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.error("[GEMINI][{}] API call failed: {}", caller, msg, e);

            // Surface rate-limit info to the caller
            if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED") || msg.contains("quota")) {
                java.util.regex.Matcher m = java.util.regex.Pattern
                        .compile("Please retry in ([\\d.]+)s")
                        .matcher(msg);
                String retryMsg = m.find()
                        ? "Rate limit reached. Please wait " + Math.ceil(Double.parseDouble(m.group(1))) + " seconds and try again."
                        : "Rate limit reached. Please wait a moment and try again.";
                throw new RuntimeException(retryMsg, e);
            }
            throw new RuntimeException("AI service is currently unavailable. Please try again later.", e);
        }
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 12) return "***";
        return key.substring(0, 8) + "..." + key.substring(key.length() - 4);
    }
}
