package com.studyspace.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime startTime;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime endTime;
    
    private Integer durationMinutes;
    private Boolean isGroupSession;
    private String roomCode;
    private SessionStatus status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
    private Long creatorId;
    private UserDTO creator;
    private Long studyGroupId;
    private Integer participantCount;
    private List<UserDTO> participants;
    private String duration;
    
    private SessionVisibility visibility;
}

