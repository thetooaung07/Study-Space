package com.studyspace.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;

/**
 * Amazon S3 / Tigris Object Storage implementation of {@link FileStorageService}.
 * Active only when the 'prod' profile is enabled.
 */
@Service
@Profile("docker")
@Slf4j
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket-name}")
    private String bucketName;

    @Override
    public String store(MultipartFile file, String destinationPath) {
        String originalName = file.getOriginalFilename();
        String extension = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf('.'))
                : "";
        String fileName = java.util.UUID.randomUUID() + extension;
        String objectName = destinationPath.startsWith("/") ? destinationPath.substring(1) : destinationPath;
        objectName = objectName + "/" + fileName;

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String signedUrl = generatePresignedUrl(objectName);
            log.info("Uploaded file to S3/Tigris: s3://{}/{}", bucketName, objectName);
            return signedUrl;

        } catch (IOException ex) {
            log.error("Failed to read file for S3 upload", ex);
            throw new IllegalStateException("Failed to read file for upload", ex);
        } catch (Exception ex) {
            log.error("Failed to upload file to S3/Tigris", ex);
            throw new IllegalStateException("Failed to upload file to S3/Tigris: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void delete(String fileUrl) {
        String objectName = extractObjectNameFromUrl(fileUrl);
        if (objectName == null) {
            log.warn("Could not extract S3 object name from URL: {}. Skipping deletion.", fileUrl);
            return;
        }

        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .build();

            s3Client.deleteObject(deleteRequest);
            log.info("Deleted S3/Tigris object: {}", objectName);
        } catch (Exception ex) {
            log.warn("Could not delete S3/Tigris file {}: {}", fileUrl, ex.getMessage());
        }
    }

    @Override
    public String copy(String fileUrl, String newDestinationPath) {
        String sourceObjectName = extractObjectNameFromUrl(fileUrl);
        if (sourceObjectName == null) {
            throw new IllegalArgumentException("Invalid S3 URL provided for copy: " + fileUrl);
        }

        String extension = sourceObjectName.contains(".")
                ? sourceObjectName.substring(sourceObjectName.lastIndexOf('.'))
                : "";
        String newFileName = java.util.UUID.randomUUID() + extension;
        String targetObjectName = newDestinationPath.startsWith("/") ? newDestinationPath.substring(1) : newDestinationPath;
        targetObjectName = targetObjectName + "/" + newFileName;

        try {
            CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                    .sourceBucket(bucketName)
                    .sourceKey(sourceObjectName)
                    .destinationBucket(bucketName)
                    .destinationKey(targetObjectName)
                    .build();

            s3Client.copyObject(copyRequest);
            String signedUrl = generatePresignedUrl(targetObjectName);
            log.info("Copied S3/Tigris object from {} to {}", sourceObjectName, targetObjectName);
            return signedUrl;

        } catch (Exception ex) {
            log.error("Failed to copy S3/Tigris object", ex);
            throw new IllegalStateException("Failed to copy file in S3/Tigris: " + ex.getMessage(), ex);
        }
    }

    private String generatePresignedUrl(String objectName) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofDays(7))
                .getObjectRequest(b -> b.bucket(bucketName).key(objectName))
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    private String extractObjectNameFromUrl(String url) {
        try {
            java.net.URL parsedUrl = new java.net.URL(url);
            String path = parsedUrl.getPath();
            // Remove leading slash if present, and potentially bucket name prefix if path-style is used
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            // If the URL uses path-style access (e.g. endpoint.com/bucket/key), remove the bucket prefix
            if (path.startsWith(bucketName + "/")) {
                return path.substring(bucketName.length() + 1);
            }
            return path;
        } catch (Exception e) {
            return null;
        }
    }
}
