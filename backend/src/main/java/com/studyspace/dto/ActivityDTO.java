package com.studyspace.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.studyspace.types.ActivityType;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
/**
 * Javadoc for ActivityDTO.
 */
/**
 * Javadoc for ActivityDTO.
 */
public class ActivityDTO {

    /**
     * Default constructor.
     */
    public ActivityDTO() {}
    private Long id;
    private ActivityType type;
    private String message;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", timezone = "UTC")
    private LocalDateTime timestamp;
    
    private Long sessionId;
    private Long userId;
    private String userName;
    private String userProfilePictureUrl;
}
