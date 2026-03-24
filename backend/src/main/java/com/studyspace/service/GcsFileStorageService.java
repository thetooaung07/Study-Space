package com.studyspace.service;

import com.google.cloud.storage.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Google Cloud Storage implementation — active when spring.profiles.active=gcs.
 * Requires the google-cloud-storage library and GCP credentials configured
 * via GOOGLE_APPLICATION_CREDENTIALS env var or Workload Identity.
 */
@Slf4j
@Service
@Profile("gcs")
@RequiredArgsConstructor
public class GcsFileStorageService implements FileStorageService {

    private final Storage gcsStorage;

    @Value("${app.gcs.bucket-name}")
    private String bucketName;

    @Override
    public String store(MultipartFile file, String folder) {
        try {
            String originalName = file.getOriginalFilename();
            String extension = (originalName != null && originalName.contains("."))
                    ? originalName.substring(originalName.lastIndexOf('.'))
                    : "";
            String objectName = folder + "/" + UUID.randomUUID() + extension;

            BlobId blobId = BlobId.of(bucketName, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(file.getContentType())
                    .build();

            gcsStorage.create(blobInfo, file.getBytes());

            // Generate a signed URL valid for 7 days (635040 minutes)
            String signedUrl = gcsStorage.signUrl(blobInfo, 7, TimeUnit.DAYS).toString();
            log.info("Uploaded file to GCS: gs://{}/{}", bucketName, objectName);
            return signedUrl;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to upload file to GCS: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void delete(String fileUrl) {
        try {
            // Extract object name from signed URL or public URL
            // Signed URL format: https://storage.googleapis.com/{bucket}/{object}?X-Goog-...
            String objectName = extractObjectNameFromUrl(fileUrl);
            gcsStorage.delete(BlobId.of(bucketName, objectName));
            log.info("Deleted GCS object: {}", objectName);
        } catch (Exception ex) {
            log.warn("Could not delete GCS file {}: {}", fileUrl, ex.getMessage());
        }
    }

    private String extractObjectNameFromUrl(String url) {
        // Strip query string and bucket prefix
        String base = url.contains("?") ? url.substring(0, url.indexOf('?')) : url;
        String prefix = "storage.googleapis.com/" + bucketName + "/";
        int idx = base.indexOf(prefix);
        return idx >= 0 ? base.substring(idx + prefix.length()) : base;
    }
}
