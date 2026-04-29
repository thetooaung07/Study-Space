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
 * <p>Implements a local RAG pattern by injecting extracted document text as
 * context before the user's question.
 */
@Service
@Slf4j
public class GeminiService {

    private static final String MODEL = "gemini-3.1-flash-lite-preview";
    private static final int MAX_CONTEXT_CHARS = 10_000;

    private final Client client;

    public GeminiService(@Value("${gemini.api.key}") String apiKey) {
        this.client = new Client.Builder().apiKey(apiKey).build();
        log.info("[GEMINI] Service initialised — model: {}, key: {}", MODEL, maskKey(apiKey));
    }

    /**
     * Sends the student's question to Gemini, optionally enriched with document context.
     *
     * @param context      extracted text from a tagged PDF (may be blank)
     * @param userQuestion the student's question
     * @return Gemini's answer as a plain string
     */
    public String askGeminiWithContext(String context, String userQuestion) {
        log.info("[GEMINI] Question: '{}' | context present: {} ({} chars)",
                userQuestion,
                context != null && !context.isBlank(),
                context != null ? context.length() : 0);

        String prompt = buildPrompt(context, userQuestion);
        log.info("[GEMINI] Prompt built — {} total chars", prompt.length());
        log.info("[GEMINI] Sending to Gemini API...");

        try {
            GenerateContentResponse response = client.models.generateContent(
                    MODEL,
                    prompt,
                    null
            );

            String answer = response.text();
            log.info("[GEMINI] Answer received — {} chars: '{}'",
                    answer != null ? answer.length() : 0,
                    answer != null && answer.length() > 200 ? answer.substring(0, 200) + "..." : answer);
            return answer;

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.error("[GEMINI] API call failed: {}", msg, e);

            // Surface rate-limit info to the user if possible
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

    // ─── private helpers ────────────────────────────────────────────────────────

    private String buildPrompt(String context, String userQuestion) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a helpful academic teaching assistant for students using the StudySpace platform.\n\n");

        if (context != null && !context.isBlank()) {
            sb.append("Use the following document content as context to answer the student's question. ");
            sb.append("Only rely on this context if it is relevant; otherwise answer from your general knowledge.\n\n");
            sb.append("--- DOCUMENT CONTEXT ---\n");
            String safeContext = context.length() > MAX_CONTEXT_CHARS
                    ? context.substring(0, MAX_CONTEXT_CHARS) + "\n[...document truncated...]"
                    : context;
            sb.append(safeContext);
            sb.append("\n--- END OF DOCUMENT CONTEXT ---\n\n");
        }

        sb.append("Student's question: ").append(userQuestion);
        return sb.toString();
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 12) return "***";
        return key.substring(0, 8) + "..." + key.substring(key.length() - 4);
    }
}
