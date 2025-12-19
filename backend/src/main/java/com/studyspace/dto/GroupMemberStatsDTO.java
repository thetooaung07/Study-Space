package com.studyspace.dto;

import lombok.*;

/**
 * DTO for group member study statistics - used by the complex JPQL query
 * that joins User, SessionParticipant, StudySession, and StudyGroup tables.
 */
@Data
@NoArgsConstructor
@Builder
public class GroupMemberStatsDTO {
    private Long userId;
    private String fullName;
    private String profilePictureUrl;
    private Long totalMinutes;
    private Long sessionCount;
    
    // Constructor for JPQL projection (must match query SELECT order)
    public GroupMemberStatsDTO(Long userId, String fullName, String profilePictureUrl, 
                                Long totalMinutes, Long sessionCount) {
        this.userId = userId;
        this.fullName = fullName;
        this.profilePictureUrl = profilePictureUrl;
        this.totalMinutes = totalMinutes != null ? totalMinutes : 0L;
        this.sessionCount = sessionCount != null ? sessionCount : 0L;
    }
}
