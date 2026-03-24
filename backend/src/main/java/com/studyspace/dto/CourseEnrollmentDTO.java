package com.studyspace.dto;

import com.studyspace.types.EnrollmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CourseEnrollmentDTO {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private EnrollmentStatus status;
    private LocalDateTime enrolledAt;
    private Integer enrollmentCount;
    private Integer sectionCount;
}
