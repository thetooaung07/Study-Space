package com.studyspace.controller;

import com.studyspace.dto.ChatQueryRequest;
import com.studyspace.dto.ChatQueryResponse;
import com.studyspace.service.DocumentService;
import com.studyspace.service.MemoryManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the AI-assisted chat feature.
 *
 * <p>Endpoint: {@code POST /api/chat/query}
 *
 * <p>The controller is intentionally thin — it delegates all orchestration
 * to {@link MemoryManager}, which handles session loading, prompt assembly,
 * Gemini calls, buffer management, and persistence.
 *
 * <p><strong>Memory phases wired in:</strong>
 * <ul>
 *   <li>Phase 1 — Session lifecycle (load/create via conversationId)</li>
 *   <li>Phase 2 — Recent message buffer injected into prompt</li>
 *   <li>Phase 3 — Rolling summary compression on buffer overflow</li>
 *   <li>Phase 4 — Document context injected at prompt-build time via PromptBuilder</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class ChatController {

    private final DocumentService documentService;
    private final MemoryManager memoryManager;

    /**
     * Accepts a student's question (optionally with a tagged document URL) and returns an
     * AI-generated teaching-assistant answer with full memory context.
     *
     * <p>Orchestration (performed inside {@link MemoryManager}):
     * <ol>
     *   <li>If {@code conversationId} is present, load session memory from the DB.</li>
     *   <li>If {@code documentUrl} is present, extract text from the PDF.</li>
     *   <li>Build a rich prompt: system + summary + recent buffer + document context + question.</li>
     *   <li>Call Gemini and obtain the answer.</li>
     *   <li>Append both turns to the buffer; compress if needed.</li>
     *   <li>Persist the updated conversation state.</li>
     * </ol>
     *
     * <p>Graceful degradation: if PDF extraction fails the call continues without document context.
     * If {@code conversationId} is missing the call is stateless (backward-compatible).
     */
    @PostMapping("/query")
    public ResponseEntity<ChatQueryResponse> query(@RequestBody ChatQueryRequest request) {
        log.info("[CHAT_CTRL] POST /api/chat/query — conversationId={}, questionLength={}, hasDoc={}",
                request.getConversationId() != null ? request.getConversationId() : "<none>",
                request.getQuestion() != null ? request.getQuestion().length() : 0,
                request.getDocumentUrl() != null && !request.getDocumentUrl().isBlank());

        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new RuntimeException("Question must not be empty.");
        }

        // ── Extract document context (Phase 4 integration) ───────────────────
        String documentContext = "";
        String contextDocumentTitle = null;

        if (request.getDocumentUrl() != null && !request.getDocumentUrl().isBlank()) {
            contextDocumentTitle = request.getDocumentTitle();
            log.info("[CHAT_CTRL] Extracting PDF text from: {}", request.getDocumentUrl());
            try {
                documentContext = documentService.extractTextFromPdfUrl(request.getDocumentUrl());
                log.info("[CHAT_CTRL] PDF extracted — {} chars", documentContext.length());
            } catch (RuntimeException e) {
                log.warn("[CHAT_CTRL] PDF extraction failed for '{}': {}. Answering without document context.",
                        request.getDocumentUrl(), e.getMessage());
                documentContext = "";
            }
        }

        // ── Delegate to MemoryManager ────────────────────────────────────────
        log.info("[CHAT_CTRL] Handing off to MemoryManager — conversationId={}",
                request.getConversationId() != null ? request.getConversationId() : "<stateless>");

        String answer = memoryManager.handleQuery(
                request.getConversationId(),
                request.getQuestion(),
                documentContext
        );

        log.info("[CHAT_CTRL] Response ready — answerLength={}, contextDoc={}",
                answer != null ? answer.length() : 0, contextDocumentTitle);

        return ResponseEntity.ok(new ChatQueryResponse(answer, contextDocumentTitle));
    }
}
