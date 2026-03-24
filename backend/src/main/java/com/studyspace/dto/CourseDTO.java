package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CourseDTO {
    private Long id;
    private String title;
    private String description;
    private Long instructorId;
    private String instructorName;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CourseSectionDTO> sections;
    private long enrollmentCount;
}
