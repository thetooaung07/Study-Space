package com.studyspace.service;

import com.studyspace.dto.AuthResponse;
import com.studyspace.dto.LoginRequest;
import com.studyspace.dto.RegisterRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.entity.User;
import com.studyspace.mapper.UserMapper;
import com.studyspace.repository.UserRepository;
import com.studyspace.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;

    public AuthResponse register(RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration failed - username already exists: {}", request.getUsername());
            throw new RuntimeException("Username already exists");
        }

        var user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .authProvider(com.studyspace.types.AuthProvider.LOCAL)
                .build();
        

        var savedUser = userRepository.save(user);
        log.info("User registered successfully: {} (ID: {})", savedUser.getEmail(), savedUser.getId());
        var jwtToken = jwtUtil.generateToken(new org.springframework.security.core.userdetails.User(
                savedUser.getEmail(), savedUser.getPassword(), java.util.Collections.emptyList()));
        
        return AuthResponse.builder()
                .token(jwtToken)
                .user(userMapper.toDTO(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for: {}", request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            log.warn("Login failed for {}: {}", request.getEmail(), e.getMessage());
            throw e;
        }
        
        var user = userRepository.findByEmail(request.getEmail())
                .or(() -> userRepository.findByUsername(request.getEmail()))
                .orElseThrow(() -> new RuntimeException("User not found after auth - this should not happen"));
                
        var jwtToken = jwtUtil.generateToken(new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), java.util.Collections.emptyList()));
        
        log.info("Login successful for user: {} (ID: {})", user.getEmail(), user.getId());
        return AuthResponse.builder()
                .token(jwtToken)
                .user(userMapper.toDTO(user))
                .build();
    }

    public UserDTO getCurrentUser(String email) {
        log.debug("Fetching current user for: {}", email);
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByUsername(email))
                .orElseThrow(() -> {
                    log.error("User not found for email/username: {}", email);
                    return new RuntimeException("User not found");
                });
        return userMapper.toDTO(user);
    }
}
