package com.studyspace.service;

import com.studyspace.dto.AuthResponse;
import com.studyspace.dto.LoginRequest;
import com.studyspace.dto.RegisterRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.entity.User;
import com.studyspace.mapper.UserMapper;
import com.studyspace.repository.UserRepository;
import com.studyspace.security.JwtUtil;
import com.studyspace.types.AuthProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    // ─── register ───────────────────────────────────────────────────────────────

    @Test
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .email("alice@example.com")
                .username("alice")
                .password("secret")
                .fullName("Alice")
                .build();

        User savedUser = User.builder()
                .id(1L)
                .email("alice@example.com")
                .username("alice")
                .password("hashed")
                .authProvider(AuthProvider.LOCAL)
                .build();

        UserDTO userDTO = UserDTO.builder().id(1L).email("alice@example.com").username("alice").build();

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(passwordEncoder.encode("secret")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-token");
        when(userMapper.toDTO(savedUser)).thenReturn(userDTO);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("alice@example.com", response.getUser().getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("duplicate@example.com")
                .username("newuser")
                .build();

        when(userRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_DuplicateUsername_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("new@example.com")
                .username("takenuser")
                .build();

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("takenuser")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    // ─── login ──────────────────────────────────────────────────────────────────

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("bob@example.com");
        request.setPassword("pass");

        User user = User.builder()
                .id(2L)
                .email("bob@example.com")
                .password("hashed")
                .build();

        UserDTO userDTO = UserDTO.builder().id(2L).email("bob@example.com").build();

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-token");
        when(userMapper.toDTO(user)).thenReturn(userDTO);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_BadCredentials_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("bob@example.com");
        request.setPassword("wrong");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_FallsBackToUsernameSearch() {
        // The login method first tries findByEmail, then findByUsername as fallback
        LoginRequest request = new LoginRequest();
        request.setEmail("bobbyhandles");  // login via username
        request.setPassword("pass");

        User user = User.builder().id(3L).email("bob@example.com").username("bobbyhandles").password("hashed").build();
        UserDTO userDTO = UserDTO.builder().id(3L).username("bobbyhandles").build();

        // findByEmail returns empty; fallback to findByUsername succeeds
        when(userRepository.findByEmail("bobbyhandles")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("bobbyhandles")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(any(UserDetails.class))).thenReturn("jwt-token");
        when(userMapper.toDTO(user)).thenReturn(userDTO);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
    }

    // ─── getCurrentUser ──────────────────────────────────────────────────────────

    @Test
    void getCurrentUser_ByEmail_ReturnsDTO() {
        User user = User.builder().id(4L).email("carol@example.com").build();
        UserDTO dto = UserDTO.builder().id(4L).email("carol@example.com").build();

        when(userRepository.findByEmail("carol@example.com")).thenReturn(Optional.of(user));
        when(userMapper.toDTO(user)).thenReturn(dto);

        UserDTO result = authService.getCurrentUser("carol@example.com");

        assertNotNull(result);
        assertEquals("carol@example.com", result.getEmail());
    }

    @Test
    void getCurrentUser_NotFound_ThrowsException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("ghost@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.getCurrentUser("ghost@example.com"));
    }
}
