package com.studyspace.controller;

import com.studyspace.dto.ActivityDTO;
import com.studyspace.types.ActivityType;
import com.studyspace.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ActivityController {
    
    private final ActivityService activityService;
    
    @PostMapping
    public ResponseEntity<ActivityDTO> createActivity(
        @RequestParam Long sessionId,
        @RequestParam Long userId,
        @RequestParam ActivityType type,
        @RequestParam(required = false) String message
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(activityService.createActivity(sessionId, userId, type, message));
    }
    
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<ActivityDTO>> getSessionActivities(@PathVariable Long sessionId) {
        return ResponseEntity.ok(activityService.getSessionActivities(sessionId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityDTO>> getUserActivities(@PathVariable Long userId) {
        return ResponseEntity.ok(activityService.getUserActivities(userId));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ActivityDTO>> getRecentActivities() {
        return ResponseEntity.ok(activityService.getRecentGlobalActivities());
    }
}
