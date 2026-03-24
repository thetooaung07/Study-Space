package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CourseSummaryDTO {
    private Long id;
    private String title;
    private String description;
    private Long instructorId;
    private String instructorName;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private long enrollmentCount;
    private int sectionCount;
}
