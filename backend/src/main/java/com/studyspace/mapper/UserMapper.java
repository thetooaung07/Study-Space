package com.studyspace.mapper;

import com.studyspace.dto.UserDTO;
import com.studyspace.entity.User;
import org.springframework.stereotype.Component;

// to convert the User entity to UserDTO
@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePictureUrl(user.getProfilePictureUrl())
                .totalStudyMinutes(user.getTotalStudyMinutes())
                .currentStreak(user.getCurrentStreak())
                .currentStatus(user.getCurrentStatus())
                .role(user.getRole())
                .authProvider(user.getAuthProvider())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
