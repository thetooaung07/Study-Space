package com.studyspace.dto;

import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
/**
 * Javadoc for CourseDTO.
 */
public class CourseDTO {

    /**
     * Default constructor.
     */
    public CourseDTO() {}
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
