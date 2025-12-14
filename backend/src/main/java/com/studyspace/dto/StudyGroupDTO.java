package com.studyspace.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyGroupDTO {
    private Long id;
    private String name;
    private String description;
    private String inviteCode;
    private Boolean isPrivate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long creatorId;
    private Integer memberCount;
}
