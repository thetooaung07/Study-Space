package com.studyspace.controller;

import com.studyspace.dto.CreateSessionRequest;
import com.studyspace.dto.StudySessionDTO;
import com.studyspace.service.StudySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class StudySessionController {
    
    private final StudySessionService sessionService;
    
    @PostMapping
    public ResponseEntity<StudySessionDTO> createSession(
        @RequestParam Long userId,
        @Valid @RequestBody CreateSessionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(userId, request));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudySessionDTO> getSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }
    
    @GetMapping
    public ResponseEntity<List<StudySessionDTO>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StudySessionDTO>> getUserSessions(@PathVariable Long userId) {
        return ResponseEntity.ok(sessionService.getUserSessions(userId));
    }

    @GetMapping("/user/{userId}/history")
    public ResponseEntity<List<StudySessionDTO>> getUserSessionHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(sessionService.getUserSessionHistory(userId));
    }
    
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<StudySessionDTO>> getGroupSessions(
        @PathVariable Long groupId,
        @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(sessionService.getGroupSessions(groupId, userId));
    }
    
    // startSession and endSession endpoints removed as logic is handled via creation and participant removal
    
    @PostMapping("/{id}/participants/{userId}")
    public ResponseEntity<Void> addParticipant(@PathVariable Long id, @PathVariable Long userId) {
        sessionService.addParticipant(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    @PutMapping("/{id}/participants/{userId}/pause")
    public ResponseEntity<Void> pauseParticipant(@PathVariable Long id, @PathVariable Long userId) {
        sessionService.pauseParticipant(id, userId);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/participants/{userId}/resume")
    public ResponseEntity<Void> resumeParticipant(@PathVariable Long id, @PathVariable Long userId) {
        sessionService.resumeParticipant(id, userId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}/participants/{userId}")
    public ResponseEntity<Void> removeParticipant(
        @PathVariable Long id, 
        @PathVariable Long userId,
        @RequestParam(required = false) Integer studyMinutes
    ) {
        sessionService.removeParticipant(id, userId, studyMinutes);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
}
