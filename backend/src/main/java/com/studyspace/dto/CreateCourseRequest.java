package com.studyspace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCourseRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Boolean isPublished = false;
}
