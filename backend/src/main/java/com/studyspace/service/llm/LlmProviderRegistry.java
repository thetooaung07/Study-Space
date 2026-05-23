package com.studyspace.service.llm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resolves the correct {@link LlmProvider} at call-time from the provider name
 * supplied in the API request.
 *
 * <p>Spring auto-wires all {@link LlmProvider} beans into the constructor list;
 * they are indexed by {@link LlmProvider#providerName()} for O(1) lookup.
 * Unknown names fall back to Gemini so existing clients remain unaffected.
 */
@Service
@Slf4j
public class LlmProviderRegistry {

    private final Map<String, LlmProvider> providers;
    private final LlmProvider              defaultProvider;

    public LlmProviderRegistry(List<LlmProvider> providerList) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(LlmProvider::providerName, Function.identity()));
        // Gemini is the default; throw early if it is somehow not registered
        this.defaultProvider = providers.get("gemini");
        if (this.defaultProvider == null) {
            throw new IllegalStateException("GeminiLlmProvider must be registered as a Spring bean");
        }
        log.info("[LLM_REGISTRY] Registered providers: {}", providers.keySet());
    }

    /**
     * Returns the {@link LlmProvider} for the given name, falling back to Gemini
     * if the name is null, blank, or does not match any registered provider.
     *
     * @param name provider name from the API request ({@code "gemini"} | {@code "openai"})
     */
    public LlmProvider resolve(String name) {
        if (name == null || name.isBlank()) return defaultProvider;
        LlmProvider provider = providers.get(name.toLowerCase());
        if (provider == null) {
            log.warn("[LLM_REGISTRY] Unknown provider '{}' — falling back to Gemini", name);
            return defaultProvider;
        }
        return provider;
    }
}
