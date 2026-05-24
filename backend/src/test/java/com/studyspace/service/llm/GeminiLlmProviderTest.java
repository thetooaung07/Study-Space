package com.studyspace.service.llm;

import com.studyspace.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiLlmProviderTest {

    @Mock
    private GeminiService mockGeminiService;

    @InjectMocks
    private GeminiLlmProvider geminiLlmProvider;

    @Test
    void testProviderName() {
        assertEquals("gemini", geminiLlmProvider.providerName());
    }

    @Test
    void testGenerate() {
        String prompt = "Test prompt";
        String expectedResponse = "Mocked Response";
        when(mockGeminiService.generate(prompt)).thenReturn(expectedResponse);

        String result = geminiLlmProvider.generate(prompt);

        assertEquals(expectedResponse, result);
        verify(mockGeminiService).generate(prompt);
    }

    @Test
    void testGenerateSummary() {
        String prompt = "Summarize this";
        String expectedResponse = "Mocked Summary";
        when(mockGeminiService.generateSummary(prompt)).thenReturn(expectedResponse);

        String result = geminiLlmProvider.generateSummary(prompt);

        assertEquals(expectedResponse, result);
        verify(mockGeminiService).generateSummary(prompt);
    }
}
