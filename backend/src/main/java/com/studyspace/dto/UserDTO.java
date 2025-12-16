package com.studyspace.dto;

import com.studyspace.types.UserStatus;
import lombok.*;

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
    private UserStatus currentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AuthProvider authProvider;
}
