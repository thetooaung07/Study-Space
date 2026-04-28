package com.studyspace.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;

/**
 * Utility service for extracting plain text from PDF documents.
 *
 * <p>Accepts a {@code documentUrl} that can be:
 * <ul>
 *   <li>A local file path (e.g. {@code /uploads/abc.pdf}) – used during local development.</li>
 *   <li>An absolute file URI (e.g. {@code file:///data/uploads/abc.pdf}).</li>
 *   <li>Any HTTP/HTTPS URL – ready for S3, GCS, or any future cloud storage.</li>
 * </ul>
 */
@Service
@Slf4j
public class DocumentService {

    public String extractTextFromPdfUrl(String documentUrl) {
        log.debug("Extracting text from PDF at: {}", documentUrl);
        try {
            byte[] pdfBytes = fetchBytes(documentUrl);
            try (PDDocument document = Loader.loadPDF(pdfBytes)) {
                String text = stripper().getText(document);
                log.debug("Extracted {} chars from: {}", text.length(), documentUrl);
                return text;
            }
        } catch (IOException e) {
            log.error("Failed to extract text from '{}': {}", documentUrl, e.getMessage());
            throw new RuntimeException("Failed to read document: " + e.getMessage(), e);
        }
    }

    // ─── private ────────────────────────────────────────────────────────────────

    private byte[] fetchBytes(String documentUrl) throws IOException {
        if (documentUrl.startsWith("http://") || documentUrl.startsWith("https://")) {
            URL url = URI.create(documentUrl).toURL();
            try (InputStream in = url.openStream()) {
                return in.readAllBytes();
            }
        }

        if (documentUrl.startsWith("file://")) {
            return readFile(new File(URI.create(documentUrl)), documentUrl);
        }

        // Bare local path — resolve relative to the project working directory
        String cleanPath = documentUrl.replaceFirst("^/", "");
        File file = new File(System.getProperty("user.dir"), cleanPath);
        return readFile(file, documentUrl);
    }

    private byte[] readFile(File file, String originalRef) throws IOException {
        if (!file.exists() || !file.isFile()) {
            throw new IOException("Document not found: " + originalRef);
        }
        return java.nio.file.Files.readAllBytes(file.toPath());
    }

    private PDFTextStripper stripper() throws IOException {
        return new PDFTextStripper();
    }
}
