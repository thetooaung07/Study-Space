package com.studyspace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
/**
 * Javadoc for ChangePasswordRequest.
 */
/**
 * Javadoc for ChangePasswordRequest.
 */
public class ChangePasswordRequest {

    /**
     * Default constructor.
     */
    public ChangePasswordRequest() {}
    private String currentPassword;
    private String newPassword;
}
