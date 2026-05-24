package com.studyspace.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Local disk file storage — active when spring.profiles.active=local (default for dev).
 * Files are saved under ${app.upload.dir}/{folder}/ and served by Spring's static resource mapping.
 */
@Slf4j
@Service
@Profile("local")
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;
    
    private static final String UPLOADS_PREFIX = "/uploads/";

    @Override
    public String store(MultipartFile file, String folder) {
        try {
            String originalName = file.getOriginalFilename();
            String extension = (originalName != null && originalName.contains("."))
                    ? originalName.substring(originalName.lastIndexOf('.'))
                    : "";
            String fileName = UUID.randomUUID() + extension;

            Path targetDir = Paths.get(uploadDir, folder).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Return a relative URL path served by Spring static resources
            return UPLOADS_PREFIX + folder + "/" + fileName;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store file: " + ex.getMessage(), ex);
        }
    }

    @Override
    public void delete(String fileUrl) {
        try {
            // Convert URL like /uploads/courses/file.pdf → absolute path under uploadDir
            String relativePath = fileUrl.replace(UPLOADS_PREFIX, "");
            Path filePath = Paths.get(uploadDir, relativePath).toAbsolutePath().normalize();
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted local file: {}", filePath);
            }
        } catch (IOException ex) {
            log.warn("Could not delete local file {}: {}", fileUrl, ex.getMessage());
        }
    }

    @Override
    public String copy(String sourceFileUrl, String targetFolder) {
        try {
            String relativePath = sourceFileUrl.replace(UPLOADS_PREFIX, "");
            Path sourcePath = Paths.get(uploadDir, relativePath).toAbsolutePath().normalize();

            // Determine extension from source
            String sourceFileName = sourcePath.getFileName().toString();
            String extension = sourceFileName.contains(".")
                    ? sourceFileName.substring(sourceFileName.lastIndexOf('.'))
                    : "";
            String newFileName = UUID.randomUUID() + extension;

            Path targetDir = Paths.get(uploadDir, targetFolder).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(newFileName);
            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Copied file from {} to {}", sourcePath, targetPath);
            return UPLOADS_PREFIX + targetFolder + "/" + newFileName;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to copy file: " + ex.getMessage(), ex);
        }
    }
}
