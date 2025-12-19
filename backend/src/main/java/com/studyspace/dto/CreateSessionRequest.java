package com.studyspace.dto;

import com.studyspace.types.Subject;
import com.studyspace.types.FocusLevel;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    private Subject subject;
    
    private Boolean isGroupSession;
    
    private Long studyGroupId;
    
    private FocusLevel focusLevel;
}

