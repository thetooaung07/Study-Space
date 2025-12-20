package com.studyspace.dto;

import com.studyspace.types.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberDTO {
    private Long id;
    private String username;
    private String fullName;
    private String profilePictureUrl;
    private UserStatus currentStatus;
    private boolean isAdmin;
    private Long totalStudyMinutesInGroup; // Optional, can be 0 for now if expensive
    private LocalDateTime joinedAt; // If available in relation, otherwise null
}
