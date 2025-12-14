package com.studyspace.dto;

import com.studyspace.types.ActivityType;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityDTO {
    private Long id;
    private ActivityType type;
    private String message;
    private LocalDateTime timestamp;
    private Long sessionId;
    private Long userId;
}
