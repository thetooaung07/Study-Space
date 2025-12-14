package com.studyspace.controller;

import com.studyspace.dto.CreateUserRequest;
import com.studyspace.dto.UserDTO;
import com.studyspace.types.UserStatus;
import com.studyspace.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
