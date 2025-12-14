package com.studyspace.dto;

import com.studyspace.types.SessionStatus;
import com.studyspace.types.Subject;
import lombok.*;
import java.time.LocalDateTime;

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
    private Long studyGroupId;
}
