package com.studyspace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.CopyObjectResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.MalformedURLException;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class S3FileStorageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @InjectMocks
    private S3FileStorageService storageService;

    private final String bucketName = "test-bucket";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(storageService, "bucketName", bucketName);
    }

    @Test
    void store_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String destinationPath = "/uploads/test";

        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().build());

        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenAnswer(invocation -> {
            GetObjectPresignRequest req = invocation.getArgument(0);
            String objKey = req.getObjectRequest().key();
            PresignedGetObjectRequest mockReq = mock(PresignedGetObjectRequest.class);
            when(mockReq.url()).thenReturn(new URL("https://s3.example.com/test-bucket/" + objKey + "?signature=xyz"));
            return mockReq;
        });

        String resultUrl = storageService.store(file, destinationPath);

        ArgumentCaptor<PutObjectRequest> putRequestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(putRequestCaptor.capture(), any(RequestBody.class));
        
        assertEquals(bucketName, putRequestCaptor.getValue().bucket());
        String key = putRequestCaptor.getValue().key();
        org.junit.jupiter.api.Assertions.assertTrue(key.startsWith("uploads/test/"));
        org.junit.jupiter.api.Assertions.assertTrue(key.endsWith(".txt"));
        org.junit.jupiter.api.Assertions.assertTrue(resultUrl.startsWith("https://s3.example.com/test-bucket/uploads/test/"));
    }

    @Test
    void store_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        String destinationPath = "uploads/test.txt";

        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenThrow(new RuntimeException("S3 error"));

        assertThrows(IllegalStateException.class, () -> storageService.store(file, destinationPath));
    }

    @Test
    void delete_SuccessWithPathStyleUrl() {
        String fileUrl = "https://s3.example.com/test-bucket/uploads/test.txt";

        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenReturn(DeleteObjectResponse.builder().build());

        storageService.delete(fileUrl);

        ArgumentCaptor<DeleteObjectRequest> deleteRequestCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(deleteRequestCaptor.capture());
        
        assertEquals(bucketName, deleteRequestCaptor.getValue().bucket());
        assertEquals("uploads/test.txt", deleteRequestCaptor.getValue().key());
    }

    @Test
    void delete_SuccessWithVirtualHostedUrl() {
        String fileUrl = "https://test-bucket.s3.example.com/uploads/test.txt";

        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenReturn(DeleteObjectResponse.builder().build());

        storageService.delete(fileUrl);

        ArgumentCaptor<DeleteObjectRequest> deleteRequestCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(deleteRequestCaptor.capture());
        
        assertEquals(bucketName, deleteRequestCaptor.getValue().bucket());
        assertEquals("uploads/test.txt", deleteRequestCaptor.getValue().key());
    }

    @Test
    void delete_InvalidUrl() {
        storageService.delete("not-a-valid-url");
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void delete_ThrowsException_SwallowsException() {
        String fileUrl = "https://s3.example.com/test-bucket/uploads/test.txt";

        when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                .thenThrow(new RuntimeException("S3 error"));

        // Should not throw, just log
        storageService.delete(fileUrl);
        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void copy_Success() throws Exception {
        String sourceUrl = "https://s3.example.com/test-bucket/uploads/source.txt";
        String destinationPath = "/uploads/target";

        when(s3Client.copyObject(any(CopyObjectRequest.class)))
                .thenReturn(CopyObjectResponse.builder().build());

        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenAnswer(invocation -> {
            GetObjectPresignRequest req = invocation.getArgument(0);
            String objKey = req.getObjectRequest().key();
            PresignedGetObjectRequest mockReq = mock(PresignedGetObjectRequest.class);
            when(mockReq.url()).thenReturn(new URL("https://s3.example.com/test-bucket/" + objKey + "?signature=xyz"));
            return mockReq;
        });

        String resultUrl = storageService.copy(sourceUrl, destinationPath);

        ArgumentCaptor<CopyObjectRequest> copyRequestCaptor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client).copyObject(copyRequestCaptor.capture());

        assertEquals(bucketName, copyRequestCaptor.getValue().sourceBucket());
        assertEquals("uploads/source.txt", copyRequestCaptor.getValue().sourceKey());
        assertEquals(bucketName, copyRequestCaptor.getValue().destinationBucket());
        
        String key = copyRequestCaptor.getValue().destinationKey();
        org.junit.jupiter.api.Assertions.assertTrue(key.startsWith("uploads/target/"));
        org.junit.jupiter.api.Assertions.assertTrue(key.endsWith(".txt"));
        org.junit.jupiter.api.Assertions.assertTrue(resultUrl.startsWith("https://s3.example.com/test-bucket/uploads/target/"));
    }

    @Test
    void copy_InvalidSourceUrl() {
        String sourceUrl = "not-a-url";
        String destinationPath = "/uploads/target.txt";

        assertThrows(IllegalArgumentException.class, () -> storageService.copy(sourceUrl, destinationPath));
        verify(s3Client, never()).copyObject(any(CopyObjectRequest.class));
    }

    @Test
    void copy_ThrowsException() {
        String sourceUrl = "https://s3.example.com/test-bucket/uploads/source.txt";
        String destinationPath = "/uploads/target.txt";

        when(s3Client.copyObject(any(CopyObjectRequest.class)))
                .thenThrow(new RuntimeException("Copy error"));

        assertThrows(IllegalStateException.class, () -> storageService.copy(sourceUrl, destinationPath));
    }
}
