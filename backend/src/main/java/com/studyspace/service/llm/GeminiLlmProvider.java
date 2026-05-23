package com.studyspace.service.llm;

import com.studyspace.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * {@link LlmProvider} implementation backed by Google Gemini.
 *
 * <p>Delegates to the existing {@link GeminiService}, keeping Gemini-specific
 * SDK code isolated from the provider-agnostic orchestration layer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiLlmProvider implements LlmProvider {

    private final GeminiService geminiService;

    @Override
    public String generate(String prompt) {
        log.debug("[GEMINI_PROVIDER] Delegating generate() to GeminiService");
        return geminiService.generate(prompt);
    }

    @Override
    public String generateSummary(String summarisationPrompt) {
        log.debug("[GEMINI_PROVIDER] Delegating generateSummary() to GeminiService");
        return geminiService.generateSummary(summarisationPrompt);
    }

    @Override
    public String providerName() {
        return "gemini";
    }
}
