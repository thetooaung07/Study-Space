package com.studyspace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateWorkspaceSectionRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Integer orderIndex = 0;
}
