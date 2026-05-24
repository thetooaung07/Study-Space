package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.AuthResponse;
import com.studyspace.dto.LoginRequest;
import com.studyspace.dto.RegisterRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.exception.GlobalExceptionHandler;
import com.studyspace.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc unit tests for AuthController.
 * The Spring security filter chain is bypassed; only the controller logic is tested.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    // ─── POST /api/auth/register ──────────────────────────────────────────────────

    @Test
    void register_ValidRequest_Returns200WithToken() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("alice@example.com")
                .username("alice")
                .password("secret")
                .fullName("Alice")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("jwt-token")
                .user(UserDTO.builder().id(1L).email("alice@example.com").build())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.user.email").value("alice@example.com"));
    }

    @Test
    void register_DuplicateEmail_Returns400() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Email already exists"));

        RegisterRequest request = RegisterRequest.builder()
                .username("dupuser")
                .email("dup@example.com")
                .password("secret")
                .fullName("Dup User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    // ─── POST /api/auth/login ─────────────────────────────────────────────────────

    @Test
    void login_ValidCredentials_Returns200WithToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("bob@example.com");
        request.setPassword("password");

        AuthResponse response = AuthResponse.builder()
                .token("jwt-token")
                .user(UserDTO.builder().id(2L).email("bob@example.com").build())
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_BadCredentials_Returns4xx() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest();
        request.setEmail("bob@example.com");
        request.setPassword("wrong");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void login_MissingFields_Returns400() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(""); // blank email
        request.setPassword(""); // blank password

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void register_MissingFields_Returns400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .username("")
                .email("not-an-email")
                .password("123")
                .fullName("")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    // ─── GET /api/auth/me ─────────────────────────────────────────────────────────

    @Test
    void getCurrentUser_Authenticated_Returns200() throws Exception {
        UserDTO userDTO = UserDTO.builder().id(1L).email("alice@example.com").build();

        // Seed SecurityContext with an authenticated principal
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("alice@example.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(authService.getCurrentUser("alice@example.com")).thenReturn(userDTO);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"));

        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUser_Unauthenticated_Returns401() throws Exception {
        // No authentication in security context
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        SecurityContextHolder.clearContext();
    }
}
