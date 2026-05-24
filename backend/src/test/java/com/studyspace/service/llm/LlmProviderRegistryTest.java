package com.studyspace.service.llm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LlmProviderRegistryTest {

    private LlmProvider mockGemini;
    private LlmProvider mockOpenAi;

    @BeforeEach
    void setUp() {
        mockGemini = mock(LlmProvider.class);
        when(mockGemini.providerName()).thenReturn("gemini");

        mockOpenAi = mock(LlmProvider.class);
        when(mockOpenAi.providerName()).thenReturn("openai");
    }

    @Test
    void testResolveValidProviders() {
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of(mockGemini, mockOpenAi));

        assertEquals(mockGemini, registry.resolve("gemini"));
        assertEquals(mockOpenAi, registry.resolve("openai"));
    }

    @Test
    void testResolveFallbackToGemini() {
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of(mockGemini, mockOpenAi));

        assertEquals(mockGemini, registry.resolve(null));
        assertEquals(mockGemini, registry.resolve(""));
        assertEquals(mockGemini, registry.resolve("unknown"));
    }
    
    @Test
    void testResolveCaseInsensitive() {
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of(mockGemini, mockOpenAi));
        assertEquals(mockOpenAi, registry.resolve("OPENAI"));
    }

    @Test
    void testMissingGeminiThrowsException() {
        assertThrows(IllegalStateException.class, () -> new LlmProviderRegistry(List.of(mockOpenAi)));
    }
}
