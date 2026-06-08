package com.studyspace.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.CopyRequest;
import com.google.cloud.storage.CopyWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GcsFileStorageServiceTest {

    @Mock
    private Storage gcsStorage;

    private GcsFileStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new GcsFileStorageService(gcsStorage);
        ReflectionTestUtils.setField(storageService, "bucketName", "test-bucket");
    }

    @Test
    void store_Success() throws Exception {
        MultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        URL mockUrl = new URL("https://storage.googleapis.com/test-bucket/folder/uuid.txt?signature");
        
        when(gcsStorage.create(any(BlobInfo.class), any(byte[].class))).thenReturn(null);
        when(gcsStorage.signUrl(any(BlobInfo.class), eq(7L), eq(TimeUnit.DAYS))).thenReturn(mockUrl);

        String resultUrl = storageService.store(file, "folder");

        assertNotNull(resultUrl);
        assertEquals(mockUrl.toString(), resultUrl);
        
        ArgumentCaptor<BlobInfo> blobInfoCaptor = ArgumentCaptor.forClass(BlobInfo.class);
        verify(gcsStorage).create(blobInfoCaptor.capture(), eq("content".getBytes()));
        
        BlobInfo captured = blobInfoCaptor.getValue();
        assertEquals("test-bucket", captured.getBlobId().getBucket());
        assertTrue(captured.getBlobId().getName().startsWith("folder/"));
        assertTrue(captured.getBlobId().getName().endsWith(".txt"));
        assertEquals("text/plain", captured.getContentType());
    }

    @Test
    void store_WithoutExtension() throws Exception {
        MultipartFile file = new MockMultipartFile("file", "testfile", "text/plain", "content".getBytes());
        URL mockUrl = new URL("https://storage.googleapis.com/test-bucket/folder/uuid?signature");
        
        when(gcsStorage.create(any(BlobInfo.class), any(byte[].class))).thenReturn(null);
        when(gcsStorage.signUrl(any(BlobInfo.class), eq(7L), eq(TimeUnit.DAYS))).thenReturn(mockUrl);

        String resultUrl = storageService.store(file, "folder");
        
        ArgumentCaptor<BlobInfo> blobInfoCaptor = ArgumentCaptor.forClass(BlobInfo.class);
        verify(gcsStorage).create(blobInfoCaptor.capture(), eq("content".getBytes()));
        assertFalse(blobInfoCaptor.getValue().getBlobId().getName().contains(".txt"));
    }

    @Test
    void store_ThrowsException() throws Exception {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getOriginalFilename()).thenReturn("test.txt");
        when(mockFile.getContentType()).thenReturn("text/plain");
        when(mockFile.getBytes()).thenThrow(new java.io.IOException("Test IO Exception"));

        assertThrows(RuntimeException.class, () -> storageService.store(mockFile, "folder"));
    }

    @Test
    void delete_Success() {
        String url = "https://storage.googleapis.com/test-bucket/folder/file.txt?X-Goog-Signature=123";
        
        when(gcsStorage.delete(any(BlobId.class))).thenReturn(true);
        
        assertDoesNotThrow(() -> storageService.delete(url));
        
        ArgumentCaptor<BlobId> blobIdCaptor = ArgumentCaptor.forClass(BlobId.class);
        verify(gcsStorage).delete(blobIdCaptor.capture());
        
        assertEquals("test-bucket", blobIdCaptor.getValue().getBucket());
        assertEquals("folder/file.txt", blobIdCaptor.getValue().getName());
    }

    @Test
    void delete_WithoutQueryString() {
        String url = "https://storage.googleapis.com/test-bucket/folder/file.txt";
        
        when(gcsStorage.delete(any(BlobId.class))).thenReturn(true);
        
        assertDoesNotThrow(() -> storageService.delete(url));
        
        ArgumentCaptor<BlobId> blobIdCaptor = ArgumentCaptor.forClass(BlobId.class);
        verify(gcsStorage).delete(blobIdCaptor.capture());
        
        assertEquals("folder/file.txt", blobIdCaptor.getValue().getName());
    }

    @Test
    void delete_DifferentPrefix() {
        String url = "folder/file.txt"; // just object name directly
        
        when(gcsStorage.delete(any(BlobId.class))).thenReturn(true);
        
        assertDoesNotThrow(() -> storageService.delete(url));
        
        ArgumentCaptor<BlobId> blobIdCaptor = ArgumentCaptor.forClass(BlobId.class);
        verify(gcsStorage).delete(blobIdCaptor.capture());
        
        assertEquals("folder/file.txt", blobIdCaptor.getValue().getName());
    }
    
    @Test
    void delete_ExceptionCaughtAndLogged() {
        String url = "https://storage.googleapis.com/test-bucket/folder/file.txt";
        
        when(gcsStorage.delete(any(BlobId.class))).thenThrow(new RuntimeException("GCS Error"));
        
        // delete method catches and logs the exception, so it shouldn't throw
        assertDoesNotThrow(() -> storageService.delete(url));
    }

    @Test
    void copy_Success() throws Exception {
        String sourceUrl = "https://storage.googleapis.com/test-bucket/source/file.pdf?sign";
        URL mockUrl = new URL("https://storage.googleapis.com/test-bucket/target/uuid.pdf?signature");
        
        CopyWriter mockCopyWriter = mock(CopyWriter.class);
        when(mockCopyWriter.getResult()).thenReturn(null); // return value is Blob but ignored in service
        when(gcsStorage.copy(any(CopyRequest.class))).thenReturn(mockCopyWriter);
        when(gcsStorage.signUrl(any(BlobInfo.class), eq(7L), eq(TimeUnit.DAYS))).thenReturn(mockUrl);

        String resultUrl = storageService.copy(sourceUrl, "target");

        assertNotNull(resultUrl);
        assertEquals(mockUrl.toString(), resultUrl);
        
        ArgumentCaptor<CopyRequest> copyRequestCaptor = ArgumentCaptor.forClass(CopyRequest.class);
        verify(gcsStorage).copy(copyRequestCaptor.capture());
        
        CopyRequest captured = copyRequestCaptor.getValue();
        assertEquals("test-bucket", captured.getSource().getBucket());
        assertEquals("source/file.pdf", captured.getSource().getName());
        assertEquals("test-bucket", captured.getTarget().getBucket());
        assertTrue(captured.getTarget().getName().startsWith("target/"));
        assertTrue(captured.getTarget().getName().endsWith(".pdf"));
    }
    
    @Test
    void copy_ThrowsException() {
        String sourceUrl = "https://storage.googleapis.com/test-bucket/source/file.pdf";
        
        when(gcsStorage.copy(any(CopyRequest.class))).thenThrow(new RuntimeException("Copy error"));
        
        assertThrows(RuntimeException.class, () -> storageService.copy(sourceUrl, "target"));
    }
}
