package com.studyspace.controller;

import com.studyspace.dto.ChatQueryRequest;
import com.studyspace.dto.ChatQueryResponse;
import com.studyspace.service.DocumentVectorService;
import com.studyspace.service.MemoryManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the AI-assisted chat feature (Feature F4).
 *
 * <p>Endpoint: {@code POST /api/chat/query}
 *
 * <p>The controller is intentionally thin — orchestration lives in
 * {@link MemoryManager} and {@link DocumentVectorService}.
 *
 * <h3>Memory and RAG phases wired in:</h3>
 * <ul>
 *   <li>Phase 1 — Session lifecycle (load/create via conversationId)</li>
 *   <li>Phase 2 — Recent message buffer from DB</li>
 *   <li>Phase 3 — Rolling summary compression (async, on overflow)</li>
 *   <li>Phase 4 — Document context via pgvector RAG (replaces full-document injection)</li>
 *   <li>Phase 5 — Runtime LLM provider switch (Gemini / OpenAI)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class ChatController {

    private final DocumentVectorService documentVectorService;
    private final MemoryManager         memoryManager;

    /**
     * Accepts a student's question and returns an AI-generated answer.
     *
     * <p>If a {@code documentUrl} is provided, the document is re-ingested into the
     * vector store (ensuring fresh embeddings on every tagged file) and the top-3
     * most semantically relevant chunks are retrieved and injected into the prompt.
     *
     * <p>Graceful degradation: RAG failures return an empty chunk list so the
     * question is still answered from memory context alone.
     *
     * @param request JSON body containing question, optional documentUrl, conversationId, and provider
     */
    @PostMapping("/query")
    public ResponseEntity<ChatQueryResponse> query(@RequestBody ChatQueryRequest request) {
        log.info("[CHAT_CTRL] POST /api/chat/query — conversationId={}, provider={}, hasDoc={}, questionLength={}",
                request.getConversationId() != null ? request.getConversationId() : "<none>",
                request.getProvider() != null ? request.getProvider() : "gemini",
                request.getDocumentUrl() != null && !request.getDocumentUrl().isBlank(),
                request.getQuestion() != null ? request.getQuestion().length() : 0);

        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new RuntimeException("Question must not be empty.");
        }

        // ── Phase 4: RAG ingestion + retrieval ──────────────────────────────
        List<String> ragChunks = List.of();
        String contextDocumentTitle = null;

        if (request.getDocumentUrl() != null && !request.getDocumentUrl().isBlank()) {
            contextDocumentTitle = request.getDocumentTitle();
            log.info("[CHAT_CTRL] Document tagged: '{}' — ingesting into vector store", request.getDocumentUrl());
            try {
                // Always re-ingest (deletes stale chunks, re-embeds the current content)
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
        String answer = memoryManager.handleQuery(
                request.getConversationId(),
                request.getQuestion(),
                ragChunks,
                request.getProvider()
        );

        log.info("[CHAT_CTRL] Response ready — answerLength={}, contextDoc={}",
                answer != null ? answer.length() : 0, contextDocumentTitle);

        return ResponseEntity.ok(new ChatQueryResponse(answer, contextDocumentTitle));
    }
}
