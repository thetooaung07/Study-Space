package com.studyspace.service;

import com.studyspace.entity.Conversation;
import com.studyspace.entity.Message;
import com.studyspace.repository.ConversationRepository;
import com.studyspace.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AsyncMemoryCompressorTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private PromptBuilder promptBuilder;

    @Mock
    private GeminiService geminiService;

    @InjectMocks
    private AsyncMemoryCompressor compressor;

    @Test
    void compressMemoryAsync_NoMessages_DoesNothing() {
        when(messageRepository.findTop5ByConversationIdOrderByCreatedAtAsc("conv-1"))
                .thenReturn(Collections.emptyList());

        compressor.compressMemoryAsync("conv-1");

        verify(conversationRepository, never()).findById(anyString());
        verify(geminiService, never()).generateSummary(anyString());
    }

    @Test
    void compressMemoryAsync_WithMessages_CompressesAndUpdates() {
        String convId = "conv-1";
        Message m1 = Message.builder().id(1L).role("user").content("Hello").build();
        Message m2 = Message.builder().id(2L).role("assistant").content("Hi").build();
        List<Message> oldest = List.of(m1, m2);

        Conversation conversation = Conversation.builder().id(convId).summary("Old summary").build();

        when(messageRepository.findTop5ByConversationIdOrderByCreatedAtAsc(convId)).thenReturn(oldest);
        when(conversationRepository.findById(convId)).thenReturn(Optional.of(conversation));
        when(promptBuilder.buildSummarisationPromptFromPairs(eq("Old summary"), anyList()))
                .thenReturn("Prompt text");
        when(geminiService.generateSummary("Prompt text")).thenReturn("New summary");

        compressor.compressMemoryAsync(convId);

        verify(conversationRepository).save(argThat(c -> "New summary".equals(c.getSummary())));
        verify(messageRepository).deleteAllByIdIn(List.of(1L, 2L));
    }

    @Test
    void compressMemoryAsync_ExceptionThrown_HandledGracefully() {
        String convId = "conv-1";
        when(messageRepository.findTop5ByConversationIdOrderByCreatedAtAsc(convId))
                .thenThrow(new RuntimeException("DB Error"));

        // Should not throw an exception out of the method
        compressor.compressMemoryAsync(convId);

        verify(conversationRepository, never()).findById(anyString());
    }
}
