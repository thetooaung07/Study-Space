package com.studyspace.dto;

import com.studyspace.types.MaterialType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CourseMaterialDTO {
    private Long id;
    private String title;
    private String fileUrl;
    private MaterialType fileType;
    private String originalFileName;
    private LocalDateTime uploadedAt;
}
