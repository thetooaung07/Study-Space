package com.studyspace.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Paths;

/**
 * Serves locally-uploaded files under /uploads/** when running with the "local" profile.
 * Ensures the upload directory exists on startup.
 */
@Slf4j
@Configuration
@Profile("local")
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absoluteUploadDir = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
        // Ensure the directory exists
        File dir = new File(absoluteUploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
            log.info("Created upload directory: {}", absoluteUploadDir);
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absoluteUploadDir + "/");

        log.info("Serving local uploads from: {}", absoluteUploadDir);
    }
}
