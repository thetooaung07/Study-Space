package com.studyspace.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupStatsDTO {
    private Long groupId;
    private String groupName;
    private Long sessionCount;
    private Long totalStudyMinutes;
    private Double averageSessionDuration;
    private Long activeMemberCount;
}
