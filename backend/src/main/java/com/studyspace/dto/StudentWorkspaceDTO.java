package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StudentWorkspaceDTO {
    private Long id;
    private String name;
    private String description;
    private Long ownerId;
    private String ownerName;
    private int spaceCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
