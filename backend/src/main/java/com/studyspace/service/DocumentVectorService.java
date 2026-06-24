package com.studyspace.service;

import com.studyspace.entity.DocumentChunk;
import com.studyspace.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Manages the RAG (Retrieval-Augmented Generation) vector store for Course Materials.
 *
 * <h3>Two-path PDF extraction</h3>
 * <ol>
 *   <li><strong>Text-native PDFs</strong> (lecture notes, papers): Apache PDFBox extracts
 *       the embedded text layer. Fast, free, and works offline.</li>
 *   <li><strong>Image-heavy PDFs</strong> (scanned slides, diagram-only pages): if PDFBox
 *       yields fewer than {@link #MIN_CHARS_PER_PAGE} characters per page on average,
 *       the service falls back to a Gemini multimodal call that processes the PDF bytes
 *       directly, extracting text visible in images and diagrams.</li>
 * </ol>
 *
 * <h3>Re-ingestion strategy</h3>
 * Every call to {@link #ingestDocument} unconditionally deletes existing chunks for
 * the given URL before re-indexing. This keeps the store consistent without requiring
 * content-hash comparison.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentVectorService {

    /** Approximate character count per chunk (roughly 500 tokens at ~4 chars/token). */
    private static final int CHUNK_SIZE    = 2_000;

    /** Overlap between consecutive chunks to preserve cross-boundary context. */
    private static final int CHUNK_OVERLAP = 200;

    /**
     * Minimum average characters per PDF page before the Gemini multimodal
     * fallback is triggered. Below this threshold the document is considered
     * image-heavy (e.g. a scanned slide deck).
     */
    private static final int MIN_CHARS_PER_PAGE = 100;

    private final DocumentChunkRepository documentChunkRepository;
    private final GeminiService           geminiService;

    // ─── Public API ──────────────────────────────────────────────────────────

    /**
     * Ingests a Course Material into the vector store.
     *
     * <p>Always deletes all previously stored chunks for this URL before writing
     * new ones — no stale embeddings can survive a re-upload.
     *
     * @param documentUrl URL or local path of the PDF
     */
    @Transactional
    public void ingestDocument(String documentUrl) {
        log.info("[DOC_VECTOR] Starting ingestion for: {}", documentUrl);

        // Step 1 — delete stale chunks unconditionally
        documentChunkRepository.deleteByDocumentUrl(documentUrl);
        log.debug("[DOC_VECTOR] Deleted old chunks for: {}", documentUrl);

        // Step 2 — fetch raw bytes
        byte[] pdfBytes;
        try {
            pdfBytes = fetchBytes(documentUrl);
        } catch (IOException e) {
            log.error("[DOC_VECTOR] Failed to fetch PDF from '{}': {}", documentUrl, e.getMessage());
            throw new IllegalStateException("Could not read document for ingestion: " + e.getMessage(), e);
        }

        // Step 3 — extract text (with multimodal fallback for image-heavy PDFs)
        String text = extractText(pdfBytes, documentUrl);
        if (text == null || text.isBlank()) {
            log.warn("[DOC_VECTOR] No text extracted from '{}' — skipping ingestion", documentUrl);
            return;
        }
        log.info("[DOC_VECTOR] Extracted {} chars from: {}", text.length(), documentUrl);

        // Step 4 — split into overlapping chunks
        List<String> chunks = splitIntoChunks(text);
        log.info("[DOC_VECTOR] Split into {} chunks", chunks.size());

        // Step 5 — embed and persist each chunk
        List<DocumentChunk> saved = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            try {
                float[] embedding = geminiService.generateEmbedding(chunk);
                DocumentChunk dc = DocumentChunk.builder()
                        .documentUrl(documentUrl)
                        .content(chunk)
                        .embedding(embedding)
                        .build();
                saved.add(documentChunkRepository.save(dc));
            } catch (Exception e) {
                log.warn("[DOC_VECTOR] Failed to embed chunk {}/{} — skipping: {}",
                        i + 1, chunks.size(), e.getMessage());
            }
        }
        log.info("[DOC_VECTOR] Ingestion complete — {} chunks saved for: {}", saved.size(), documentUrl);
    }

    /**
     * Retrieves the {@code topK} most semantically relevant chunks for the given question.
     *
     * @param question the student's question (embedded with the same model used during ingestion)
     * @param topK     number of chunks to return
     * @return ordered list of chunk texts (most relevant first), or empty list on error
     */
    public List<String> retrieveRelevantChunks(String question, int topK) {
        log.debug("[DOC_VECTOR] Retrieving top-{} chunks for question: '{}'",
                topK, question.length() > 80 ? question.substring(0, 80) + "..." : question);
        try {
            float[] queryEmbedding = geminiService.generateEmbedding(question);
            String embeddingStr = floatArrayToVectorString(queryEmbedding);
            List<String> chunks = documentChunkRepository.findTopKByEmbedding(embeddingStr, topK);
            log.info("[DOC_VECTOR] Retrieved {} relevant chunks", chunks.size());
            return chunks;
        } catch (Exception e) {
            log.error("[DOC_VECTOR] Retrieval failed: {} — returning empty context", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ─── Text extraction ─────────────────────────────────────────────────────

    private String extractText(byte[] pdfBytes, String documentUrl) {
        // Path 1: PDFBox text extraction
        String pdfBoxText = extractWithPdfBox(pdfBytes, documentUrl);

        // Determine page count for the sparse-page heuristic
        int pageCount = getPageCount(pdfBytes);
        float charsPerPage = pageCount > 0
                ? (float) pdfBoxText.length() / pageCount
                : pdfBoxText.length();

        if (charsPerPage >= MIN_CHARS_PER_PAGE) {
            log.debug("[DOC_VECTOR] Using PDFBox text ({} chars, {:.1f} chars/page)", pdfBoxText.length(), charsPerPage);
            return pdfBoxText;
        }

        // Path 2: Gemini multimodal fallback for image-heavy / scanned PDFs
        log.info("[DOC_VECTOR] PDFBox sparse ({:.1f} chars/page < threshold {}) — using Gemini multimodal",
                charsPerPage, MIN_CHARS_PER_PAGE);
        return extractWithGeminiMultimodal(pdfBytes, documentUrl);
    }

    private String extractWithPdfBox(byte[] pdfBytes, String documentUrl) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            String text = new PDFTextStripper().getText(document);
            log.debug("[DOC_VECTOR] PDFBox extracted {} chars from '{}'", text.length(), documentUrl);
            return text;
        } catch (IOException e) {
            log.warn("[DOC_VECTOR] PDFBox extraction failed for '{}': {}", documentUrl, e.getMessage());
            return "";
        }
    }

    private int getPageCount(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            return document.getNumberOfPages();
        } catch (IOException e) {
            return 1; // safe fallback
        }
    }

    /**
     * Sends the raw PDF bytes to Gemini using the multimodal content API.
     * Gemini processes the document visually — effective for scanned pages, diagrams,
     * and slide decks where the text layer is absent or sparse.
     */
    private String extractWithGeminiMultimodal(byte[] pdfBytes, String documentUrl) {
        log.info("[DOC_VECTOR] Calling Gemini multimodal extraction for '{}'", documentUrl);
        try {
            com.google.genai.types.Part filePart =
                    com.google.genai.types.Part.fromBytes(pdfBytes, "application/pdf");
            com.google.genai.types.Part instruction = com.google.genai.types.Part.fromText(
                    "Extract all readable text from this document, including text visible " +
                    "in images, diagrams, tables, and slide content. " +
                    "Return plain text only — no markdown, no formatting.");
            com.google.genai.types.Content content =
                    com.google.genai.types.Content.fromParts(filePart, instruction);

            com.google.genai.types.GenerateContentResponse response =
                    geminiService.generateMultimodal(content);
            String extracted = response != null ? response.text() : "";
            log.info("[DOC_VECTOR] Gemini multimodal extracted {} chars", extracted.length());
            return extracted;
        } catch (Exception e) {
            log.error("[DOC_VECTOR] Gemini multimodal extraction failed: {}", e.getMessage());
            return "";
        }
    }

    // ─── Chunking ────────────────────────────────────────────────────────────

    /**
     * Splits the text into overlapping fixed-size chunks.
     *
     * <p>Character-based splitting is used as a lightweight approximation of token-based
     * splitting (roughly 4 chars per token). The {@link #CHUNK_OVERLAP} window ensures
     * that sentences spanning a chunk boundary are present in both adjacent chunks,
     * preserving context for the similarity search.
     */
    private List<String> splitIntoChunks(String text) {
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + CHUNK_SIZE, text.length());
            chunks.add(text.substring(start, end).strip());
            start += (CHUNK_SIZE - CHUNK_OVERLAP);
        }
        return chunks;
    }

    // ─── Vector utilities ────────────────────────────────────────────────────

    /** Converts a {@code float[]} to the pgvector string literal {@code [v1,v2,...]}. */
    static String floatArrayToVectorString(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(embedding[i]);
        }
        sb.append(']');
        return sb.toString();
    }

    // ─── Byte fetching (mirrors DocumentService) ─────────────────────────────

    private byte[] fetchBytes(String documentUrl) throws IOException {
        if (documentUrl.startsWith("http://") || documentUrl.startsWith("https://")) {
            URL url = URI.create(documentUrl).toURL();
            try (InputStream in = url.openStream()) {
                return in.readAllBytes();
            }
        }
        if (documentUrl.startsWith("file://")) {
            return readFile(new File(URI.create(documentUrl)));
        }
        String cleanPath = documentUrl.replaceFirst("^/", "");
        return readFile(new File(System.getProperty("user.dir"), cleanPath));
    }

    private byte[] readFile(File file) throws IOException {
        if (!file.exists() || !file.isFile()) {
            throw new IOException("Document not found: " + file.getAbsolutePath());
        }
        return java.nio.file.Files.readAllBytes(file.toPath());
    }
}
