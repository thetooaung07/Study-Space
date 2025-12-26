package com.studyspace.service;

import com.studyspace.dto.CreateUserRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.entity.User;
import com.studyspace.types.UserStatus;
import com.studyspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    
    public UserDTO createUser(CreateUserRequest request) {
        log.info("Creating user with email: {}", request.getEmail());
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("User creation failed - username already exists: {}", request.getUsername());
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("User creation failed - email already exists: {}", request.getEmail());
            throw new RuntimeException("Email already exists");
        }
        
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .profilePictureUrl(request.getProfilePictureUrl())
            .totalStudyMinutes(0)
            .currentStatus(UserStatus.OFFLINE)
            .build();
        
        User savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {}", savedUser.getId());
        return convertToDTO(savedUser);
    }
    
    public UserDTO updateUser(Long userId, com.studyspace.dto.UpdateUserRequest request) {
        log.info("Updating user ID: {}", userId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> {
                log.error("User not found with ID: {}", userId);
                return new RuntimeException("User not found");
            });
            
        if (request.getUsername() != null) {
             String newUsername = request.getUsername().trim();
             if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                 // Check if username exists and belongs to SOMEONE ELSE
                 userRepository.findByUsername(newUsername).ifPresent(existingUser -> {
                     if (!existingUser.getId().equals(user.getId())) {
                         throw new RuntimeException("Username already exists");
                     }
                 });
             }
             user.setUsername(newUsername);
        }
        
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
             if (userRepository.existsByEmail(request.getEmail())) {
                  throw new RuntimeException("Email already exists");
             }
             if (user.getAuthProvider() != com.studyspace.types.AuthProvider.LOCAL) {
                 throw new RuntimeException("You cannot change your email as you are logged in via " + user.getAuthProvider());
             }
             user.setEmail(request.getEmail());
        }
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }
        
        return convertToDTO(userRepository.save(user));
    }
    
    public void changePassword(Long userId, com.studyspace.dto.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }
        
        if (user.getAuthProvider() != com.studyspace.types.AuthProvider.LOCAL) {
            throw new RuntimeException("You cannot change your password as you are logged in via " + user.getAuthProvider());
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(user);
    }
    
    @Transactional(readOnly = true)
    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(user);
    }
    
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public UserDTO updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setCurrentStatus(status);
        return convertToDTO(userRepository.save(user));
    }
    
    public UserDTO addStudyMinutes(Long userId, Integer minutes) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setTotalStudyMinutes(user.getTotalStudyMinutes() + minutes);
        return convertToDTO(userRepository.save(user));
    }
    
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .profilePictureUrl(user.getProfilePictureUrl())
            .totalStudyMinutes(user.getTotalStudyMinutes())
            .currentStatus(user.getCurrentStatus())
            .authProvider(user.getAuthProvider())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
    
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }
}
