package com.studyspace.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime updatedAt;
    private Long creatorId;
    private Integer memberCount;
    private Integer activeMemberCount;
    private Integer totalSessionsCount;
}
