package com.studyspace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LocalFileStorageServiceTest {

    private LocalFileStorageService storageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        storageService = new LocalFileStorageService();
        ReflectionTestUtils.setField(storageService, "uploadDir", tempDir.toString());
    }

    @Test
    void store_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());
        
        String url = storageService.store(file, "courses");
        
        assertNotNull(url);
        assertTrue(url.startsWith("/uploads/courses/"));
        assertTrue(url.endsWith(".pdf"));
        
        // Verify file exists
        String relativePath = url.replace("/uploads/", "");
        Path savedFile = tempDir.resolve(relativePath);
        assertTrue(Files.exists(savedFile));
        assertEquals("dummy content", Files.readString(savedFile));
    }

    @Test
    void store_WithoutExtension() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "testfile", "text/plain", "content".getBytes());
        
        String url = storageService.store(file, "courses");
        
        assertTrue(url.startsWith("/uploads/courses/"));
        assertFalse(url.endsWith(".pdf"));
    }
    
    @Test
    void delete_Success() throws IOException {
        // Create dummy file first
        Path folderPath = tempDir.resolve("courses");
        Files.createDirectories(folderPath);
        Path filePath = folderPath.resolve("test.pdf");
        Files.writeString(filePath, "content");
        
        String url = "/uploads/courses/test.pdf";
        
        // Ensure it exists
        assertTrue(Files.exists(filePath));
        
        storageService.delete(url);
        
        assertFalse(Files.exists(filePath));
    }

    @Test
    void delete_NonExistentFile() {
        String url = "/uploads/courses/nonexistent.pdf";
        
        // Should catch internally and log without throwing exception
        assertDoesNotThrow(() -> storageService.delete(url));
    }

    @Test
    void copy_Success() throws IOException {
        // Create source file
        Path sourceFolder = tempDir.resolve("source");
        Files.createDirectories(sourceFolder);
        Path sourcePath = sourceFolder.resolve("test.pdf");
        Files.writeString(sourcePath, "copy content");
        
        String sourceUrl = "/uploads/source/test.pdf";
        
        String newUrl = storageService.copy(sourceUrl, "target");
        
        assertNotNull(newUrl);
        assertTrue(newUrl.startsWith("/uploads/target/"));
        assertTrue(newUrl.endsWith(".pdf"));
        
        // Verify new file exists and has same content
        String relativePath = newUrl.replace("/uploads/", "");
        Path copiedFile = tempDir.resolve(relativePath);
        
        assertTrue(Files.exists(copiedFile));
        assertEquals("copy content", Files.readString(copiedFile));
    }
    
    @Test
    void copy_ThrowsExceptionForNonExistentSource() {
        String sourceUrl = "/uploads/source/does-not-exist.pdf";
        
        assertThrows(RuntimeException.class, () -> storageService.copy(sourceUrl, "target"));
    }
}
