package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class WorkspaceSpaceDTO {
    private Long id;
    private String title;
    private String description;
    private Long workspaceId;
    private Long forkedFromCourseId;
    private String forkedFromCourseTitle;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkspaceSectionDTO> sections;
}
