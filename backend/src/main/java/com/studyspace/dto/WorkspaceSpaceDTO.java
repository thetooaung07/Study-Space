package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class WorkspaceSpaceDTO {
    private Long id;
    private String title;
    private String description;
    private Long workspaceId;
    private Long forkedFromCourseId;
    private String forkedFromCourseTitle;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkspaceSectionDTO> sections;

    // Sharing
    private Boolean sharingEnabled;
    private String  inviteCode;   // only populated when requester is the space owner
    private Integer guestCount;
    private Boolean isGuest;      // true when the requester is a guest, not the owner
    private List<SpaceMemberDTO> members;
}
