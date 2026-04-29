package com.studyspace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverviewDTO {
    private long activeUsersNow;
    private long totalStudyMinutes;
    private long hotSessionsCount;
    private long newGroupsToday;
}
