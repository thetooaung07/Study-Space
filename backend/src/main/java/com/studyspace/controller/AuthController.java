package com.studyspace.controller;

import com.studyspace.dto.AuthResponse;
import com.studyspace.dto.LoginRequest;
import com.studyspace.dto.RegisterRequest;
import com.studyspace.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

/**
 * REST controller for Access Control (Feature F5).
 *
 * <p>Handles user registration, login, and fetching the current authenticated user.
 */
@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    /**
     * Constructor.
     * @param authService the authService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private final AuthService authService;

    @PostMapping("/register")
    /**
     * Registers a new user account (Student or Instructor) in the system.
     *
     * @param request the registration details including email, password, name, and role
     * @return a ResponseEntity containing the authentication token and user info
     */
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request received for: {}", request.getEmail());
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    /**
     * Authenticates a user and issues a JWT token.
     *
     * @param request the login credentials (email and password)
     * @return a ResponseEntity containing the JWT token and basic user info if successful
     */
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for: {}", request.getEmail());
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    /**
     * Retrieves the profile information of the currently authenticated user.
     * Extracts the user context from the active Security Context.
     *
     * @return a ResponseEntity containing the UserDTO, or 401 if unauthenticated
     */
    public ResponseEntity<com.studyspace.dto.UserDTO> getCurrentUser() {
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Unauthenticated request to /auth/me");
            return ResponseEntity.status(401).build();
        }

        log.debug("Fetching current user for: {}", authentication.getName());
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }
}
