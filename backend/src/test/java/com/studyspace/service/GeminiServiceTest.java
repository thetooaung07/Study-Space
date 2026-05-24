package com.studyspace.service;

import com.google.genai.Client;
import com.google.genai.Models;
import com.google.genai.types.EmbedContentResponse;
import com.google.genai.types.GenerateContentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiServiceTest {

    private GeminiService geminiService;

    @Mock
    private Client mockClient;

    @Mock
    private Models mockModels;

    @Mock
    private GenerateContentResponse mockResponse;

    @BeforeEach
    void setUp() {
        geminiService = new GeminiService("dummy-key");
        // Inject mockClient into GeminiService
        ReflectionTestUtils.setField(geminiService, "client", mockClient);
        // Inject mockModels into mockClient (assuming 'models' is a public field)
        try {
            ReflectionTestUtils.setField(mockClient, "models", mockModels);
        } catch (Exception e) {
            // Ignore if field doesn't exist in mock, but it should since it's used in service
        }
    }

    @Test
    void testGenerate() throws Exception {
        when(mockModels.generateContent(eq("gemini-3-flash-preview"), any(String.class), any()))
                .thenReturn(mockResponse);
        when(mockResponse.text()).thenReturn("Mocked Gemini Response");

        String result = geminiService.generate("Hello");
        assertEquals("Mocked Gemini Response", result);
    }

    @Test
    void testGenerateSummary() throws Exception {
        when(mockModels.generateContent(eq("gemini-3-flash-preview"), any(String.class), any()))
                .thenReturn(mockResponse);
        when(mockResponse.text()).thenReturn("Mocked Summary");

        String result = geminiService.generateSummary("Summarize this");
        assertEquals("Mocked Summary", result);
    }
}
