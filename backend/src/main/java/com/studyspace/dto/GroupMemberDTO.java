package com.studyspace.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime joinedAt; // If available in relation, otherwise null
}
