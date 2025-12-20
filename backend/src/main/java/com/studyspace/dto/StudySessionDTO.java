package com.studyspace.dto;

import com.studyspace.types.SessionStatus;
import com.studyspace.types.SessionVisibility;
import com.studyspace.types.Subject;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudySessionDTO {
    private Long id;
    private String title;
    private String description;
    private Subject subject;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Boolean isGroupSession;
    private String roomCode;
    private SessionStatus status;
    private LocalDateTime createdAt;
    private Long creatorId;
    private UserDTO creator;
    private Long studyGroupId;
    private Integer participantCount;
    private List<UserDTO> participants;
    private String duration;
    
    private SessionVisibility visibility;
}

