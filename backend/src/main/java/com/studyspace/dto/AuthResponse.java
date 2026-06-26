package com.studyspace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
/**
 * Javadoc for AuthResponse.
 */
/**
 * Javadoc for AuthResponse.
 */
public class AuthResponse {

    /**
     * Default constructor.
     */
    public AuthResponse() {}
    private String token;
    private UserDTO user;
}
