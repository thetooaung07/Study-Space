package com.studyspace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateWorkspaceRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
}
