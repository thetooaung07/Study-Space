package com.studyspace.service;

import com.studyspace.entity.Conversation;
import com.studyspace.entity.Message;
import com.studyspace.repository.ConversationRepository;
import com.studyspace.repository.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Handles asynchronous compression of the conversation memory buffer.
 *
 * <p>Placed in a separate Spring bean (not in {@link MemoryManager}) so that the
 * {@link Async} proxy applies correctly — Spring's proxy cannot intercept
 * {@code @Async} calls made from within the same bean instance.
 *
 * <p>When the message count for a conversation exceeds the configured threshold,
 * {@link MemoryManager#handleQuery} calls {@link #compressMemoryAsync} without
 * blocking the response. The method:
 * <ol>
 *   <li>Fetches the 5 oldest {@link Message} rows for the conversation.</li>
 *   <li>Sends them to Gemini as a summarisation prompt.</li>
 *   <li>Appends the result to the {@code conversations.summary} column.</li>
 *   <li>Deletes the 5 summarised rows to keep the table bounded.</li>
 * </ol>
 */
@Service
@Slf4j
public class AsyncMemoryCompressor {

    /**
     * Constructor.
     * @param messageRepository the messageRepository
     * @param conversationRepository the conversationRepository
     * @param promptBuilder the promptBuilder
     * @param geminiService the geminiService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public AsyncMemoryCompressor(MessageRepository messageRepository, ConversationRepository conversationRepository, PromptBuilder promptBuilder, GeminiService geminiService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.promptBuilder = promptBuilder;
        this.geminiService = geminiService;
    }

    private final MessageRepository      messageRepository;
    private final ConversationRepository conversationRepository;
    private final PromptBuilder          promptBuilder;
    private final GeminiService          geminiService;

    /**
     * Summarises and evicts the oldest 5 messages for the given conversation.
     * Runs in a separate thread managed by Spring's task executor.
     *
     * @param conversationId UUID of the conversation to compress
     */
    @Async
    @Transactional
    public void compressMemoryAsync(String conversationId) {
        log.info("[ASYNC_COMPRESS] Starting compression for conversationId={}", conversationId);
        try {
            List<Message> oldest = messageRepository
                    .findTop5ByConversationIdOrderByCreatedAtAsc(conversationId);

            if (oldest.isEmpty()) {
                log.info("[ASYNC_COMPRESS] No messages to compress for {}", conversationId);
                return;
            }

            // Build the old summary for the prompt
            String currentSummary = conversationRepository.findById(conversationId)
                    .map(Conversation::getSummary)
                    .orElse("");

            // Convert Message entities to the format PromptBuilder expects
            List<String[]> messagePairs = oldest.stream()
                    .map(m -> new String[]{m.getRole(), m.getContent()})
                    .collect(Collectors.toList());

            String summarisationPrompt =
                    promptBuilder.buildSummarisationPromptFromPairs(currentSummary, messagePairs);

            log.info("[ASYNC_COMPRESS] Calling Gemini to update summary (compressing {} messages)", oldest.size());
            String newSummary = geminiService.generateSummary(summarisationPrompt);

            // Persist updated summary
            conversationRepository.findById(conversationId).ifPresent(conv -> {
                conv.setSummary(newSummary);
                conversationRepository.save(conv);
                log.info("[ASYNC_COMPRESS] Summary updated — {} chars", newSummary.length());
            });

            // Evict the summarised messages
            List<Long> idsToDelete = oldest.stream().map(Message::getId).collect(Collectors.toList());
            messageRepository.deleteAllByIdIn(idsToDelete);
            log.info("[ASYNC_COMPRESS] Deleted {} summarised messages for {}", idsToDelete.size(), conversationId);

        } catch (Exception e) {
            // Compression is best-effort; failure must not affect the user response
            log.error("[ASYNC_COMPRESS] Compression failed for {}: {}", conversationId, e.getMessage(), e);
        }
    }
}
