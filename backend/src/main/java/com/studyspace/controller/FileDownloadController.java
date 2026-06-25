package com.studyspace.controller;

import com.studyspace.entity.CourseMaterial;
import com.studyspace.entity.WorkspaceMaterial;
import com.studyspace.repository.CourseMaterialRepository;
import com.studyspace.repository.WorkspaceMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileDownloadController {

    private final CourseMaterialRepository courseMaterialRepository;
    private final WorkspaceMaterialRepository workspaceMaterialRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam Long materialId, @RequestParam String type) {
        String fileUrl;
        String originalFileName;

        if ("COURSE".equalsIgnoreCase(type)) {
            CourseMaterial material = courseMaterialRepository.findById(materialId)
                    .orElseThrow(() -> new RuntimeException("Course material not found"));
            fileUrl = material.getFileUrl();
            originalFileName = material.getOriginalFileName();
        } else if ("WORKSPACE".equalsIgnoreCase(type)) {
            WorkspaceMaterial material = workspaceMaterialRepository.findById(materialId)
                    .orElseThrow(() -> new RuntimeException("Workspace material not found"));
            fileUrl = material.getFileUrl();
            originalFileName = material.getOriginalFileName();
        } else {
            throw new IllegalArgumentException("Invalid material type");
        }

        // If the URL is an absolute HTTP/HTTPS URL (e.g., from S3/Tigris), redirect the user directly to it
        if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, fileUrl)
                    .build();
        }

        // Convert URL like /uploads/courses/file.pdf → absolute path under uploadDir
        String relativePath = fileUrl.replace("/uploads/", "");
        Path filePath = Paths.get(uploadDir, relativePath).toAbsolutePath().normalize();
        File file = filePath.toFile();

        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new FileSystemResource(file);

        String contentType = "application/octet-stream";
        try {
            contentType = java.nio.file.Files.probeContentType(filePath);
        } catch (java.io.IOException e) {
            // Ignore, default to octet-stream
        }

        return ResponseEntity.ok()
                // Explicitly define the content disposition to 'inline' to allow the browser to open it directly
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + originalFileName + "\"")
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .body(resource);
    }
}
