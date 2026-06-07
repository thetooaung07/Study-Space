package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SpaceMessageDTO {
    private Long id;
    private String content;
    private Long spaceId;
    private Long userId;
    private String userFullName;
    private String userProfilePictureUrl;
    private LocalDateTime createdAt;
}
