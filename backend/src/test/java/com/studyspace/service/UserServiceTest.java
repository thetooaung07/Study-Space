package com.studyspace.service;

import com.studyspace.dto.ChangePasswordRequest;
import com.studyspace.dto.CreateUserRequest;
import com.studyspace.dto.UpdateUserRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.entity.StudyGroup;
import com.studyspace.entity.User;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.AuthProvider;
import com.studyspace.types.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_Success() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password");
        request.setFullName("Test User");

        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .fullName("Test User")
                .build();

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDTO result = userService.createUser(request);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUser_UsernameExists() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("existinguser");

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.createUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_EmailExists() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newuser");
        request.setEmail("existing@example.com");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.createUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUser_Success() {
        Long userId = 1L;
        User user = new User();
        user.setId(userId);
        user.setGroups(new HashSet<>());
        user.setCreatedGroups(new HashSet<>());

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        userService.deleteUser(userId);

        verify(userRepository).delete(user);
    }

    @Test
    void deleteUser_WithGroups() {
        Long userId = 1L;
        User user = new User();
        user.setId(userId);
        
        StudyGroup group1 = new StudyGroup();
        group1.setId(1L);
        group1.setMembers(new HashSet<>(Set.of(user)));
        
        StudyGroup group2 = new StudyGroup();
        group2.setId(2L);
        group2.setMembers(new HashSet<>(Set.of(user)));
        
        user.setGroups(new HashSet<>(Set.of(group1, group2)));
        user.setCreatedGroups(new HashSet<>());

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        userService.deleteUser(userId);

        verify(userRepository).delete(user);
        assertTrue(user.getGroups().isEmpty());
    }

    @Test
    void deleteUser_NotFound() {
        Long userId = 99L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.deleteUser(userId));
        verify(userRepository, never()).delete(any());
    }

    @Test
    void updateUser_Success() {
        Long userId = 1L;
        User user = User.builder()
                .id(userId)
                .username("olduser")
                .email("old@example.com")
                .fullName("Old Name")
                .authProvider(AuthProvider.LOCAL)
                .build();

        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("newuser");
        request.setFullName("New Name");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDTO result = userService.updateUser(userId, request);

        verify(userRepository).save(user);
        assertEquals("newuser", user.getUsername());
        assertEquals("New Name", user.getFullName());
    }

    @Test
    void changePassword_Success() {
        Long userId = 1L;
        User user = User.builder()
                .id(userId)
                .password("encodedOldPassword")
                .authProvider(AuthProvider.LOCAL)
                .build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPassword");
        request.setNewPassword("newPassword");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPassword", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        userService.changePassword(userId, request);

        verify(userRepository).save(user);
        verify(passwordEncoder).encode("newPassword");
    }

    @Test
    void changePassword_WrongCurrentPassword() {
        Long userId = 1L;
        User user = User.builder()
                .id(userId)
                .password("encodedOldPassword")
                .authProvider(AuthProvider.LOCAL)
                .build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPassword");
        request.setNewPassword("newPassword");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "encodedOldPassword")).thenReturn(false);

        assertThrows(RuntimeException.class, () -> userService.changePassword(userId, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_OAuthUser() {
        Long userId = 1L;
        User user = User.builder()
                .id(userId)
                .password("encodedPassword")
                .authProvider(AuthProvider.GOOGLE)
                .build();

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("password");
        request.setNewPassword("newPassword");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> userService.changePassword(userId, request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserStatus_Success() {
        Long userId = 1L;
        User user = User.builder()
                .id(userId)
                .currentStatus(UserStatus.OFFLINE)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDTO result = userService.updateUserStatus(userId, UserStatus.STUDYING);

        verify(userRepository).save(user);
        assertEquals(UserStatus.STUDYING, user.getCurrentStatus());
    }

    @Test
    void addStudyMinutes_Success() {
        Long userId = 1L;
        User user = User.builder()
                .id(userId)
                .totalStudyMinutes(100)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDTO result = userService.addStudyMinutes(userId, 50);

        verify(userRepository).save(user);
        assertEquals(150, user.getTotalStudyMinutes());
    }
}
