package com.studyspace.dto;

import lombok.*;
import java.time.LocalDateTime;

import com.studyspace.types.GroupType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyGroupDTO {
    private Long id;
    private String name;
    private String description;
    private String inviteCode;
    private GroupType groupType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long creatorId;
    private Integer memberCount;
    private Integer activeMemberCount;
    private Integer totalSessionsCount;
}
