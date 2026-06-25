package com.studyspace.security;

import com.studyspace.entity.User;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.AuthProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OAuth2LoginSuccessHandlerTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private OAuth2User oAuth2User;

    @InjectMocks
    private OAuth2LoginSuccessHandler successHandler;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        ReflectionTestUtils.setField(successHandler, "frontendCallbackUrl", "http://localhost:3000/auth/callback");
    }

    @Test
    void onAuthenticationSuccess_ExistingUser() throws Exception {
        when(oAuth2User.getAttribute("email")).thenReturn("test@example.com");
        when(oAuth2User.getAttribute("name")).thenReturn("Test User");
        
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setEmail("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("mock-jwt-token");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        assertEquals("http://localhost:3000/auth/callback?token=mock-jwt-token", response.getRedirectedUrl());
        verify(userRepository, never()).save(any());
    }

    @Test
    void onAuthenticationSuccess_NewGoogleUser() throws Exception {
        when(oAuth2User.getAttribute("email")).thenReturn("new@google.com");
        when(oAuth2User.getAttribute("name")).thenReturn("New User");
        when(oAuth2User.getAttribute("picture")).thenReturn("http://google.com/avatar.jpg");
        when(userRepository.findByEmail("new@google.com")).thenReturn(Optional.empty());
        
        User savedUser = new User();
        savedUser.setId(2L);
        savedUser.setEmail("new@google.com");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("mock-jwt-token");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User capturedUser = userCaptor.getValue();
        assertEquals("new@google.com", capturedUser.getEmail());
        assertEquals("new", capturedUser.getUsername());
        assertEquals("New User", capturedUser.getFullName());
        assertEquals("http://google.com/avatar.jpg", capturedUser.getProfilePictureUrl());
        assertEquals(AuthProvider.GOOGLE, capturedUser.getAuthProvider());
        assertEquals("http://localhost:3000/auth/callback?token=mock-jwt-token", response.getRedirectedUrl());
    }

    @Test
    void onAuthenticationSuccess_NewGitHubUserNoEmail() throws Exception {
        when(oAuth2User.getAttribute("email")).thenReturn(null);
        when(oAuth2User.getAttribute("login")).thenReturn("github_user");
        when(oAuth2User.getAttribute("name")).thenReturn(null);
        when(oAuth2User.getAttribute("avatar_url")).thenReturn("http://github.com/avatar.jpg");
        when(userRepository.findByEmail("github_user@github.com")).thenReturn(Optional.empty());
        
        User savedUser = new User();
        savedUser.setId(3L);
        savedUser.setEmail("github_user@github.com");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("mock-jwt-token");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User capturedUser = userCaptor.getValue();
        assertEquals("github_user@github.com", capturedUser.getEmail());
        assertEquals("github_user", capturedUser.getUsername());
        assertEquals("github_user", capturedUser.getFullName());
        assertEquals("http://github.com/avatar.jpg", capturedUser.getProfilePictureUrl());
        assertEquals(AuthProvider.GITHUB, capturedUser.getAuthProvider());
    }
}
