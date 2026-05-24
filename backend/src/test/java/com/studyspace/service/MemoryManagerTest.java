package com.studyspace.service;

import com.studyspace.entity.Conversation;
import com.studyspace.entity.Message;
import com.studyspace.repository.ConversationRepository;
import com.studyspace.repository.MessageRepository;
import com.studyspace.service.llm.LlmProvider;
import com.studyspace.service.llm.LlmProviderRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemoryManagerTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private PromptBuilder promptBuilder;

    @Mock
    private LlmProviderRegistry llmProviderRegistry;

    @Mock
    private AsyncMemoryCompressor asyncMemoryCompressor;

    @Mock
    private LlmProvider llmProvider;

    @InjectMocks
    private MemoryManager memoryManager;

    @BeforeEach
    void setUp() {
        lenient().when(llmProviderRegistry.resolve(anyString())).thenReturn(llmProvider);
        lenient().when(llmProvider.providerName()).thenReturn("mock-provider");
    }

    @Test
    void handleQuery_StatelessMode_ShouldNotPersist() {
        // Arrange
        String question = "What is stateless?";
        String expectedAnswer = "This is a stateless answer.";
        List<String> chunks = List.of("chunk1");
        
        when(promptBuilder.buildRuntimePrompt(eq(""), eq(List.of()), eq(chunks), eq(question)))
                .thenReturn("stateless-prompt");
        when(llmProvider.generate("stateless-prompt")).thenReturn(expectedAnswer);

        // Act
        String answer = memoryManager.handleQuery(null, question, chunks, "gemini");

        // Assert
        assertEquals(expectedAnswer, answer);
        
        verify(conversationRepository, never()).findById(anyString());
        verify(conversationRepository, never()).save(any());
        verify(messageRepository, never()).save(any());
        verify(asyncMemoryCompressor, never()).compressMemoryAsync(anyString());
    }

    @Test
    void handleQuery_StatefulMode_WithExistingConversation_BelowCompressionThreshold() {
        // Arrange
        String convId = "conv-123";
        String question = "Hello stateful";
        String expectedAnswer = "Hi there";
        List<String> chunks = List.of();
        
        Conversation existingConv = Conversation.builder()
                .id(convId)
                .summary("Existing summary")
                .build();
                
        Message recentMsg = Message.builder().content("Prev").build();

        when(conversationRepository.findById(convId)).thenReturn(Optional.of(existingConv));
        when(messageRepository.findTop10ByConversationIdOrderByCreatedAtAsc(convId))
                .thenReturn(List.of(recentMsg));
        when(promptBuilder.buildRuntimePrompt(eq("Existing summary"), eq(List.of(recentMsg)), eq(chunks), eq(question)))
                .thenReturn("stateful-prompt");
        when(llmProvider.generate("stateful-prompt")).thenReturn(expectedAnswer);
        
        when(messageRepository.countByConversationId(convId)).thenReturn((long) MemoryManager.COMPRESSION_THRESHOLD);

        // Act
        String answer = memoryManager.handleQuery(convId, question, chunks, "openai");

        // Assert
        assertEquals(expectedAnswer, answer);
        
        verify(conversationRepository, never()).save(any(Conversation.class));
        verify(messageRepository, times(2)).save(any(Message.class)); // 1 user msg, 1 assistant msg
        verify(asyncMemoryCompressor, never()).compressMemoryAsync(convId);
    }

    @Test
    void handleQuery_StatefulMode_WithNewConversation_AboveCompressionThreshold() {
        // Arrange
        String convId = "conv-new";
        String question = "Trigger compression";
        String expectedAnswer = "Done";
        List<String> chunks = List.of("chunk2");

        when(conversationRepository.findById(convId)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenAnswer(inv -> inv.getArgument(0));
        
        when(messageRepository.findTop10ByConversationIdOrderByCreatedAtAsc(convId)).thenReturn(List.of());
        when(promptBuilder.buildRuntimePrompt(eq(""), eq(List.of()), eq(chunks), eq(question)))
                .thenReturn("new-prompt");
        when(llmProvider.generate("new-prompt")).thenReturn(expectedAnswer);
        
        when(messageRepository.countByConversationId(convId)).thenReturn((long) MemoryManager.COMPRESSION_THRESHOLD + 1);

        // Act
        String answer = memoryManager.handleQuery(convId, question, chunks, "gemini");

        // Assert
        assertEquals(expectedAnswer, answer);
        
        verify(conversationRepository, times(1)).save(any(Conversation.class));
        verify(messageRepository, times(2)).save(any(Message.class));
        verify(asyncMemoryCompressor, times(1)).compressMemoryAsync(convId);
    }
}
