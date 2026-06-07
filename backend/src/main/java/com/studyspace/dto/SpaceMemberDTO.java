package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SpaceMemberDTO {
    private Long id;
    private String fullName;
    private String username;
    private String profilePictureUrl;
    private String role; // "OWNER" or "GUEST"
}
