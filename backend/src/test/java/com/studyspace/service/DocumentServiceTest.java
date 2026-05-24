package com.studyspace.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @InjectMocks
    private DocumentService documentService;

    @Test
    void extractTextFromPdfUrl_LocalFile_Success(@TempDir Path tempDir) throws IOException {
        File pdfFile = tempDir.resolve("test.pdf").toFile();
        Files.writeString(pdfFile.toPath(), "dummy bytes");

        String fileUrl = "file://" + pdfFile.getAbsolutePath();
        
        PDDocument mockDoc = mock(PDDocument.class);

        try (MockedStatic<Loader> mockedLoader = Mockito.mockStatic(Loader.class);
             MockedConstruction<PDFTextStripper> mockedStripper = Mockito.mockConstruction(PDFTextStripper.class, (mock, context) -> {
                 when(mock.getText(any(PDDocument.class))).thenReturn("Hello PDFBox");
             })) {
            
            mockedLoader.when(() -> Loader.loadPDF(any(byte[].class))).thenReturn(mockDoc);

            String extracted = documentService.extractTextFromPdfUrl(fileUrl);

            assertNotNull(extracted);
            assertTrue(extracted.contains("Hello PDFBox"));
        }
    }

    @Test
    void extractTextFromPdfUrl_FileNotFound_ThrowsException() {
        String invalidUrl = "file:///invalid/path/that/does/not/exist.pdf";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            documentService.extractTextFromPdfUrl(invalidUrl);
        });
        
        assertTrue(exception.getMessage().contains("Failed to read document"));
    }
    
    @Test
    void extractTextFromPdfUrl_RelativePath_ThrowsException() {
        String invalidUrl = "invalid/path/that/does/not/exist.pdf";

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            documentService.extractTextFromPdfUrl(invalidUrl);
        });
        
        assertTrue(exception.getMessage().contains("Failed to read document"));
    }
}
