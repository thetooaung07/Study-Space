package com.studyspace.controller;

import com.studyspace.dto.CreateGroupRequest;
import com.studyspace.dto.GroupStatsDTO;
import com.studyspace.dto.StudyGroupDTO;
import com.studyspace.service.StudyGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class StudyGroupController {
    
    private final StudyGroupService groupService;
    
    @PostMapping
    public ResponseEntity<StudyGroupDTO> createGroup(
        @RequestParam Long creatorId,
        @Valid @RequestBody CreateGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(creatorId, request));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudyGroupDTO> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }
    
    @GetMapping("/invite/{inviteCode}")
    public ResponseEntity<StudyGroupDTO> getGroupByInviteCode(@PathVariable String inviteCode) {
        return ResponseEntity.ok(groupService.getGroupByInviteCode(inviteCode));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StudyGroupDTO>> getUserGroups(@PathVariable Long userId) {
        return ResponseEntity.ok(groupService.getUserGroups(userId));
    }
    
    @GetMapping("/creator/{userId}")
    public ResponseEntity<List<StudyGroupDTO>> getCreatedGroups(@PathVariable Long userId) {
        return ResponseEntity.ok(groupService.getCreatedGroups(userId));
    }
    
    @PostMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> addMember(@PathVariable Long id, @PathVariable Long userId) {
        groupService.addMember(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
    
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        groupService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/leaderboard")
    public ResponseEntity<List<GroupStatsDTO>> getGroupLeaderboard() {
        return ResponseEntity.ok(groupService.getGroupLeaderboard());
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<GroupStatsDTO> getGroupStats(
        @PathVariable Long id,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cutoffDate,
        @RequestParam(defaultValue = "3000") Integer minimumMinutes
    ) {
        if (cutoffDate == null) {
            cutoffDate = LocalDateTime.now().minusDays(30);
        }
        return ResponseEntity.ok(groupService.getGroupStats(id, cutoffDate, minimumMinutes));
    }
}
