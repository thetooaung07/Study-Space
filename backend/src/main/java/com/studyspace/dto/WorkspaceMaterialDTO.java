package com.studyspace.dto;

import com.studyspace.types.MaterialType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WorkspaceMaterialDTO {
    private Long id;
    private String title;
    private String fileUrl;
    private MaterialType fileType;
    private String originalFileName;
    private Boolean isReference;
    private Boolean isHidden;
    private LocalDateTime uploadedAt;
}
