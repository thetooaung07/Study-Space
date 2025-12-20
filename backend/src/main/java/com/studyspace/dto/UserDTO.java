package com.studyspace.dto;

import com.studyspace.types.UserStatus;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.studyspace.types.AuthProvider;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String profilePictureUrl;
    private Integer totalStudyMinutes;
    private Integer currentStreak;
    private UserStatus currentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AuthProvider authProvider;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime joinedAt; // Context-specific (e.g. session join time)
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastPausedAt;
    
    private Long totalPausedSeconds;
}
