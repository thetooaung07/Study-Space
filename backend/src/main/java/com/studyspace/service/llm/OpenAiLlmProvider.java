package com.studyspace.service.llm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * {@link LlmProvider} implementation backed by OpenAI's Chat Completions API.
 *
 * <p>Uses Spring's {@link RestClient} (Boot 3.2+) for HTTP calls — no additional
 * SDK dependency is required. The default model is {@code gpt-4o-mini}, which
 * offers a good balance between quality and cost for a study-assistant workload.
 *
 * <p>If {@code openai.api.key} is blank or absent the provider logs a warning and
 * returns a graceful error message instead of crashing at startup.
 */
@Service
@Slf4j
public class OpenAiLlmProvider implements LlmProvider {

    private static final String BASE_URL = "https://api.openai.com/v1";
    private static final String MODEL    = "gpt-5.4-mini";

    private final RestClient restClient;
    private final boolean    enabled;

    public OpenAiLlmProvider(@Value("${openai.api.key:}") String apiKey) {
        this.enabled = apiKey != null && !apiKey.isBlank();
        if (this.enabled) {
            this.restClient = RestClient.builder()
                    .baseUrl(BASE_URL)
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .build();
            log.info("[OPENAI_PROVIDER] Initialised — model: {}, key: {}...{}", MODEL,
                    apiKey.substring(0, Math.min(8, apiKey.length())),
                    apiKey.length() > 4 ? apiKey.substring(apiKey.length() - 4) : "****");
        } else {
            this.restClient = null;
            log.warn("[OPENAI_PROVIDER] No API key configured — OpenAI provider disabled. " +
                     "Set openai.api.key in .env to enable.");
        }
    }

    @Override
    public String generate(String prompt) {
        return chat(prompt, "generate");
    }

    @Override
    public String generateSummary(String summarisationPrompt) {
        return chat(summarisationPrompt, "generateSummary");
    }

    @Override
    public String providerName() {
        return "openai";
    }

    // ─── private ─────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String chat(String prompt, String caller) {
        if (!enabled) {
            log.warn("[OPENAI_PROVIDER][{}] Provider disabled — falling back message", caller);
            return "OpenAI provider is not configured. Please set OPENAI_API_KEY.";
        }
        log.info("[OPENAI_PROVIDER][{}] Sending request — promptLength={}", caller, prompt.length());
        try {
            // Build request body according to OpenAI Chat Completions API schema
            Map<String, Object> body = Map.of(
                    "model", MODEL,
                    "messages", List.of(
                            Map.of("role", "user", "content", prompt)
                    )
            );

            Map<?, ?> response = restClient.post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            List<?> choices = (List<?>) response.get("choices");
            Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
            String answer = (String) message.get("content");

            log.info("[OPENAI_PROVIDER][{}] Response received — {} chars", caller,
                    answer != null ? answer.length() : 0);
            return answer;

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            log.error("[OPENAI_PROVIDER][{}] API call failed: {}", caller, msg, e);
            throw new IllegalStateException("OpenAI service is currently unavailable. Please try again later.", e);
        }
    }
}
