package com.studyspace.service.llm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpenAiLlmProviderTest {

    private OpenAiLlmProvider openAiLlmProvider;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private RestClient mockRestClient;

    @BeforeEach
    void setUp() {
        openAiLlmProvider = new OpenAiLlmProvider("dummy-key");
        // Inject the mocked RestClient
        ReflectionTestUtils.setField(openAiLlmProvider, "restClient", mockRestClient);
    }

    @Test
    void testProviderName() {
        assertEquals("openai", openAiLlmProvider.providerName());
    }

    @Test
    void testGenerate() {
        Map<String, Object> mockResponse = Map.of("choices", List.of(
                Map.of("message", Map.of("content", "Mocked response content"))
        ));

        when(mockRestClient.post()
                .uri("/chat/completions")
                .body(any(Map.class))
                .retrieve()
                .body(Map.class)).thenReturn(mockResponse);

        String result = openAiLlmProvider.generate("Test prompt");
        assertEquals("Mocked response content", result);
    }

    @Test
    void testGenerateSummary() {
        Map<String, Object> mockResponse = Map.of("choices", List.of(
                Map.of("message", Map.of("content", "Mocked summary content"))
        ));

        when(mockRestClient.post()
                .uri("/chat/completions")
                .body(any(Map.class))
                .retrieve()
                .body(Map.class)).thenReturn(mockResponse);

        String result = openAiLlmProvider.generateSummary("Test summary prompt");
        assertEquals("Mocked summary content", result);
    }

    @Test
    void testDisabledProvider() {
        OpenAiLlmProvider disabledProvider = new OpenAiLlmProvider("");
        String result = disabledProvider.generate("Test");
        assertEquals("OpenAI provider is not configured. Please set OPENAI_API_KEY.", result);
    }

    @Test
    void testChat_ExceptionThrown_ThrowsRuntimeException() {
        when(mockRestClient.post()
                .uri("/chat/completions")
                .body(any(Map.class))
                .retrieve()
                .body(Map.class)).thenThrow(new RuntimeException("Network Error"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            openAiLlmProvider.generate("Test prompt");
        });
        
        assertTrue(exception.getMessage().contains("OpenAI service is currently unavailable"));
    }
}
