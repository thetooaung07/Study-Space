package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CourseSectionDTO {
    private Long id;
    private String title;
    private String description;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private List<CourseMaterialDTO> materials;
}
