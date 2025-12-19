package com.studyspace.controller;

import com.studyspace.dto.AuthResponse;
import com.studyspace.dto.CreateUserRequest;
import com.studyspace.dto.UpdateUserRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.security.JwtUtil;
import com.studyspace.types.UserStatus;
import com.studyspace.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    
    private final UserService userService;
    
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserByUsername(username));
    }
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @PutMapping("/{id}")
    public ResponseEntity<AuthResponse> updateUser(
        @PathVariable Long id,
        @RequestBody UpdateUserRequest request
    ) {
        UserDTO updatedUser = userService.updateUser(id, request);
        
        // Use email for loading user details as that's what UserDetailsServiceImpl expects/uses as principal
       UserDetails userDetails = 
            userDetailsService.loadUserByUsername(updatedUser.getEmail());
            
        String newToken = jwtUtil.generateToken(userDetails);
        
        return ResponseEntity.ok(AuthResponse.builder()
            .user(updatedUser)
            .token(newToken)
            .build());
    }
    
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(
        @PathVariable Long id,
        @RequestBody com.studyspace.dto.ChangePasswordRequest request
    ) {
        userService.changePassword(id, request);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<UserDTO> updateUserStatus(
        @PathVariable Long id,
        @RequestParam UserStatus status
    ) {
        return ResponseEntity.ok(userService.updateUserStatus(id, status));
    }
    
    @PutMapping("/{id}/study-minutes")
    public ResponseEntity<UserDTO> addStudyMinutes(
        @PathVariable Long id,
        @RequestParam Integer minutes
    ) {
        return ResponseEntity.ok(userService.addStudyMinutes(id, minutes));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
