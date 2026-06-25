package com.studyspace.service;

import com.studyspace.dto.ConversationSummaryDTO;
import com.studyspace.dto.MessageDTO;
import com.studyspace.entity.Conversation;
import com.studyspace.repository.ConversationRepository;
import com.studyspace.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * CRUD service for user-owned AI chat conversations.
 *
 * <p>Conversations are created lazily by {@link MemoryManager} on the first query turn
 * (no explicit creation endpoint). This service handles listing, deleting, and loading
 * message history — the three operations needed to power the History popup in the UI.
 *
 * <p>All mutating operations verify that the requesting {@code userId} matches
 * the owner of the {@link Conversation} to prevent cross-user access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Returns a summary list of all conversations owned by the user,
     * ordered newest-first (by {@code updated_at}).
     */
    @Transactional(readOnly = true)
    public List<ConversationSummaryDTO> listConversations(Long userId) {
        log.info("[CONV_SVC] listConversations — userId={}", userId);
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(c -> new ConversationSummaryDTO(
                        c.getId(),
                        c.getTitle(),
                        c.getCreatedAt(),
                        c.getUpdatedAt()))
                .toList();
    }

    /**
     * Returns the full message history for the given conversation.
     * Verifies ownership before returning data.
     */
    @Transactional(readOnly = true)
    public List<MessageDTO> getMessages(String conversationId, Long userId) {
        log.info("[CONV_SVC] getMessages — conversationId={}, userId={}", conversationId, userId);
        Conversation conv = requireOwned(conversationId, userId);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId())
                .stream()
                .map(m -> new MessageDTO(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt()))
                .toList();
    }

    /**
     * Hard-deletes a conversation and all its messages (via CASCADE).
     * Verifies ownership before deleting.
     */
    @Transactional
    public void deleteConversation(String conversationId, Long userId) {
        log.info("[CONV_SVC] deleteConversation — conversationId={}, userId={}", conversationId, userId);
        requireOwned(conversationId, userId);
        conversationRepository.deleteById(conversationId);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /**
     * Loads the conversation and asserts that {@code userId} is its owner.
     * Throws 404 if not found, 403 if the user is not the owner.
     */
    private Conversation requireOwned(String conversationId, Long userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Conversation not found: " + conversationId));
        if (!conv.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Access denied to conversation: " + conversationId);
        }
        return conv;
    }
}
