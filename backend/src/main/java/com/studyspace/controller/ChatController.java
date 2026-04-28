package com.studyspace.controller;

import com.studyspace.dto.ChatQueryRequest;
import com.studyspace.dto.ChatQueryResponse;
import com.studyspace.service.DocumentService;
import com.studyspace.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the AI-assisted chat feature.
 *
 * <p>Endpoint: {@code POST /api/chat/query}
 *
 * <p>The frontend sends the student's question together with the {@code fileUrl} that is already
 * stored on the {@code WorkspaceMaterial} object (local path today, S3/GCS URL tomorrow).
 * No re-upload or DB look-up is needed — {@link DocumentService} fetches the bytes directly
 * from wherever the URL points.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class ChatController {

    private final DocumentService documentService;
    private final GeminiService geminiService;

    /**
     * Accepts a student's question (optionally with a tagged document URL) and returns an
     * AI-generated teaching-assistant answer.
     *
     * <p>Orchestration:
     * <ol>
     *   <li>If {@code documentUrl} is present, stream the PDF and extract text.</li>
     *   <li>Pass the context + question to Gemini.</li>
     *   <li>Return the answer along with the document title for the UI to display.</li>
     * </ol>
     *
     * <p>Graceful degradation: if PDF extraction fails (e.g. non-PDF file, network error
     * for a remote URL), the controller still calls Gemini without context rather than
     * returning an error — students always get some kind of answer.
     */
    @PostMapping("/query")
    public ResponseEntity<ChatQueryResponse> query(@RequestBody ChatQueryRequest request) {
        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new RuntimeException("Question must not be empty.");
        }

        String context = "";
        String contextDocumentTitle = null;

        String documentUrl = request.getDocumentUrl();
        if (documentUrl != null && !documentUrl.isBlank()) {
            contextDocumentTitle = request.getDocumentTitle();
            try {
                context = documentService.extractTextFromPdfUrl(documentUrl);
            } catch (RuntimeException e) {
                log.warn("PDF extraction failed for '{}': {}. Answering without context.", documentUrl, e.getMessage());
                context = "";
            }
        }

        String answer = geminiService.askGeminiWithContext(context, request.getQuestion());
        return ResponseEntity.ok(new ChatQueryResponse(answer, contextDocumentTitle));
    }
}
