package com.studyspace.service;

import com.studyspace.dto.AuthResponse;
import com.studyspace.dto.LoginRequest;
import com.studyspace.dto.RegisterRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.entity.User;
import com.studyspace.mapper.UserMapper;
import com.studyspace.repository.UserRepository;
import com.studyspace.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service implementation for Access Control (Feature F5).
 *
 * <p>Handles authentication logic, including JWT token generation and password hashing.
 */
@Service
@Slf4j
public class AuthService {

    /**
     * Constructor.
     * @param userRepository the userRepository
     * @param passwordEncoder the passwordEncoder
     * @param jwtUtil the jwtUtil
     * @param authenticationManager the authenticationManager
     * @param userMapper the userMapper
     */
    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AuthenticationManager authenticationManager, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userMapper = userMapper;
    }

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    /**
     * Registers a new user in the system.
     * Validates that the email and username are unique, encrypts the password,
     * and generates a JWT token for immediate login.
     *
     * @param request the registration details
     * @return an AuthResponse containing the JWT token and user details
     * @throws IllegalStateException if the email or username is already taken
     */
    public AuthResponse register(RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already exists: {}", request.getEmail());
            throw new IllegalStateException("Email already exists");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration failed - username already exists: {}", request.getUsername());
            throw new IllegalStateException("Username already exists");
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
    /**
     * Authenticates a user's credentials and issues a new JWT token.
     * Uses Spring Security's AuthenticationManager to verify the credentials.
     *
     * @param request the login credentials (email/username and password)
     * @return an AuthResponse containing the new JWT token and user details
     * @throws org.springframework.security.core.AuthenticationException if authentication fails
     */
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
    /**
     * Retrieves the profile information for the currently authenticated user.
     *
     * @param email the email or username extracted from the Security Context
     * @return the UserDTO containing the user's profile data
     * @throws RuntimeException if the user cannot be found in the database
     */
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
