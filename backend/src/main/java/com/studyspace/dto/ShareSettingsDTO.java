package com.studyspace.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShareSettingsDTO {
    private boolean sharingEnabled;
    private String  inviteCode;   // null when sharing is disabled
    private int     guestCount;
}
