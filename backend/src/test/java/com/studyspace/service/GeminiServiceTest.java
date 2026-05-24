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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import com.google.genai.types.ContentEmbedding;
import com.google.genai.types.Content;
import java.util.List;
import java.util.Optional;

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

    @Test
    void testGenerateEmbedding_Success() throws Exception {
        EmbedContentResponse mockEmbedResponse = mock(EmbedContentResponse.class);
        ContentEmbedding mockContentEmbedding = mock(ContentEmbedding.class);
        
        when(mockModels.embedContent(eq("gemini-embedding-001"), any(String.class), any()))
                .thenReturn(mockEmbedResponse);
                
        // Nested mock setup to bypass response.embeddings().get().get(0).values().get()
        when(mockEmbedResponse.embeddings()).thenReturn(Optional.of(List.of(mockContentEmbedding)));
        when(mockContentEmbedding.values()).thenReturn(Optional.of(List.of(0.1f, 0.2f, 0.3f)));

        float[] result = geminiService.generateEmbedding("Text to embed");
        assertEquals(3, result.length);
        assertEquals(0.1f, result[0]);
    }

    @Test
    void testGenerateMultimodal_Success() throws Exception {
        when(mockModels.generateContent(eq("gemini-2.0-flash"), any(Content.class), any()))
                .thenReturn(mockResponse);
        when(mockResponse.text()).thenReturn("Extracted visual text");

        Content mockContent = mock(Content.class);
        GenerateContentResponse result = geminiService.generateMultimodal(mockContent);
        
        assertNotNull(result);
        assertEquals("Extracted visual text", result.text());
    }


    @Test
    void testCallApi_RateLimitException_ParsedCorrectly() throws Exception {
        when(mockModels.generateContent(any(String.class), any(String.class), any()))
                .thenThrow(new RuntimeException("RESOURCE_EXHAUSTED: Please retry in 12.5s and then it should work"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geminiService.generate("Prompt");
        });

        assertTrue(exception.getMessage().contains("Please wait 13.0 seconds"));
    }

    @Test
    void testCallApi_GenericException() throws Exception {
        when(mockModels.generateContent(any(String.class), any(String.class), any()))
                .thenThrow(new RuntimeException("Something went wrong"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geminiService.generate("Prompt");
        });

        assertTrue(exception.getMessage().contains("AI service is currently unavailable"));
    }

    @Test
    void testCallApi_QuotaException() throws Exception {
        when(mockModels.generateContent(any(String.class), any(String.class), any()))
                .thenThrow(new RuntimeException("quota exceeded"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geminiService.generate("Prompt");
        });

        assertTrue(exception.getMessage().contains("Rate limit reached"));
    }

    @Test
    void testGenerateEmbedding_Exception() throws Exception {
        when(mockModels.embedContent(eq("gemini-embedding-001"), any(String.class), any()))
                .thenThrow(new RuntimeException("Embedding Failed"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geminiService.generateEmbedding("Text");
        });

        assertTrue(exception.getMessage().contains("Failed to generate embedding: Embedding Failed"));
    }

    @Test
    void testGenerateMultimodal_Exception() throws Exception {
        when(mockModels.generateContent(eq("gemini-2.0-flash"), any(Content.class), any()))
                .thenThrow(new RuntimeException("Multimodal Failed"));

        Content mockContent = mock(Content.class);
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            geminiService.generateMultimodal(mockContent);
        });

        assertTrue(exception.getMessage().contains("Multimodal extraction failed: Multimodal Failed"));
    }
}
