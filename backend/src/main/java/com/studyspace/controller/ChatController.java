package com.studyspace.controller;

import com.studyspace.dto.ChatQueryRequest;
import com.studyspace.dto.ChatQueryResponse;
import com.studyspace.dto.ConversationSummaryDTO;
import com.studyspace.dto.MessageDTO;
import com.studyspace.service.ConversationService;
import com.studyspace.service.DocumentVectorService;
import com.studyspace.service.MemoryManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the AI-assisted chat feature (Feature F4).
 *
 * <h2>Endpoints</h2>
 * <ul>
 *   <li>{@code POST   /api/chat/query}                        — send a question, get an AI answer</li>
 *   <li>{@code GET    /api/chat/conversations?userId=}         — list user's past conversations</li>
 *   <li>{@code DELETE /api/chat/conversations/{id}?userId=}    — hard-delete a conversation</li>
 *   <li>{@code GET    /api/chat/conversations/{id}/messages?userId=} — reload message history</li>
 * </ul>
 *
 * <h2>Memory and RAG phases wired in:</h2>
 * <ul>
 *   <li>Phase 1 — Session lifecycle (lazy load/create via conversationId + userId)</li>
 *   <li>Phase 2 — Recent message buffer from DB</li>
 *   <li>Phase 3 — Rolling summary compression (async, on overflow)</li>
 *   <li>Phase 4 — Document context via pgvector RAG</li>
 *   <li>Phase 5 — Runtime LLM provider switch (Gemini / OpenAI)</li>
 *   <li>Phase 6 — Auto-title extraction from TITLE: prefix on first turn</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class ChatController {

    /**
     * Constructor.
     * @param documentVectorService the documentVectorService
     * @param memoryManager the memoryManager
     * @param conversationService the conversationService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public ChatController(DocumentVectorService documentVectorService, MemoryManager memoryManager, ConversationService conversationService) {
        this.documentVectorService = documentVectorService;
        this.memoryManager = memoryManager;
        this.conversationService = conversationService;
    }

    private final DocumentVectorService documentVectorService;
    private final MemoryManager         memoryManager;
    private final ConversationService   conversationService;

    // ─── Query ───────────────────────────────────────────────────────────────

    /**
     * Accepts a student's question and returns an AI-generated answer.
     *
     * <p>If a {@code documentUrl} is provided, the document is re-ingested into the
     * vector store and the top-3 most semantically relevant chunks are injected into the prompt.
     *
     * <p>On the first turn of a new conversation, {@code ChatQueryResponse.conversationTitle}
     * is populated with the LLM-generated title extracted from the {@code TITLE:} prefix.
     *
     * <p>Graceful degradation: RAG failures return an empty chunk list so the
     * question is still answered from memory context alone.
     *
     * @param request JSON body containing question, optional documentUrl, conversationId,
     *                userId, and provider
     * @return the result
     */
    @PostMapping("/query")
    public ResponseEntity<ChatQueryResponse> query(@RequestBody ChatQueryRequest request) {
        log.info("[CHAT_CTRL] POST /api/chat/query — conversationId={}, userId={}, provider={}, hasDoc={}, questionLength={}",
                request.getConversationId() != null ? request.getConversationId() : "<none>",
                request.getUserId(),
                request.getProvider() != null ? request.getProvider() : "gemini",
                request.getDocumentUrl() != null && !request.getDocumentUrl().isBlank(),
                request.getQuestion() != null ? request.getQuestion().length() : 0);

        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new IllegalStateException("Question must not be empty.");
        }

        // ── Phase 4: RAG ingestion + retrieval ──────────────────────────────
        List<String> ragChunks = List.of();
        String contextDocumentTitle = null;

        if (request.getDocumentUrl() != null && !request.getDocumentUrl().isBlank()) {
            contextDocumentTitle = request.getDocumentTitle();
            log.info("[CHAT_CTRL] Document tagged: '{}' — ingesting into vector store", request.getDocumentUrl());
            try {
                documentVectorService.ingestDocument(request.getDocumentUrl());
                ragChunks = documentVectorService.retrieveRelevantChunks(request.getQuestion(), 3);
                log.info("[CHAT_CTRL] RAG retrieval complete — {} chunks injected", ragChunks.size());
            } catch (RuntimeException e) {
                log.warn("[CHAT_CTRL] RAG pipeline failed for '{}': {}. Answering without document context.",
                        request.getDocumentUrl(), e.getMessage());
                ragChunks = List.of();
            }
        }

        // ── Delegate to MemoryManager ────────────────────────────────────────
        ChatQueryResponse response = memoryManager.handleQuery(
                request.getConversationId(),
                request.getUserId(),
                request.getQuestion(),
                ragChunks,
                request.getProvider(),
                contextDocumentTitle
        );

        log.info("[CHAT_CTRL] Response ready — answerLength={}, contextDoc={}, generatedTitle={}",
                response.getAnswer() != null ? response.getAnswer().length() : 0,
                contextDocumentTitle,
                response.getConversationTitle());

        return ResponseEntity.ok(response);
    }

    // ─── Conversation management ─────────────────────────────────────────────

    /**
     * Returns the authenticated user's conversation list ordered newest-first.
     * Used to populate the History popup in the AI chat panel.
     *
     * @param userId the authenticated user's ID
     * @return the result
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryDTO>> listConversations(@RequestParam Long userId) {
        log.info("[CHAT_CTRL] GET /api/chat/conversations — userId={}", userId);
        return ResponseEntity.ok(conversationService.listConversations(userId));
    }

    /**
     * Hard-deletes a conversation and all its messages.
     * Verifies that {@code userId} owns the conversation before deleting.
     *
     * @param id     the conversation UUID
     * @param userId the authenticated user's ID
     * @return the result
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String id,
                                                   @RequestParam Long userId) {
        log.info("[CHAT_CTRL] DELETE /api/chat/conversations/{} — userId={}", id, userId);
        conversationService.deleteConversation(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns the full message history for a conversation.
     * Used when the user selects a past conversation in the History popup.
     *
     * @param id     the conversation UUID
     * @param userId the authenticated user's ID
     * @return the result
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageDTO>> getMessages(@PathVariable String id,
                                                        @RequestParam Long userId) {
        log.info("[CHAT_CTRL] GET /api/chat/conversations/{}/messages — userId={}", id, userId);
        return ResponseEntity.ok(conversationService.getMessages(id, userId));
    }
}
