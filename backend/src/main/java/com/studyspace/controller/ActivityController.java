package com.studyspace.controller;

import com.studyspace.dto.ActivityDTO;
import com.studyspace.types.ActivityType;
import com.studyspace.service.ActivityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


// User activity feed and tracking
@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "http://localhost:3000")
/**
 * REST controller for managing the User Activity Feed.
 *
 * <p>Handles logging and retrieving user activities across sessions and the platform.
 */
public class ActivityController {

    /**
     * Constructor.
     * @param activityService the activityService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }
    
    private final ActivityService activityService;
    
    @PostMapping
    /**
     * Logs a new user activity (e.g., joining a session, sending a message).
     *
     * @param sessionId the ID of the study session where the activity occurred
     * @param userId the ID of the user performing the activity
     * @param type the type of activity (e.g., JOIN, LEAVE, MESSAGE)
     * @param message an optional custom message describing the activity
     * @return a ResponseEntity containing the logged ActivityDTO with status 201 (Created)
     */
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
    /**
     * Retrieves the feed of activities that occurred within a specific study session.
     *
     * @param sessionId the ID of the study session
     * @return a ResponseEntity containing a list of ActivityDTOs
     */
    public ResponseEntity<List<ActivityDTO>> getSessionActivities(@PathVariable Long sessionId) {
        return ResponseEntity.ok(activityService.getSessionActivities(sessionId));
    }
    
    @GetMapping("/user/{userId}")
    /**
     * Retrieves the feed of recent activities performed by a specific user.
     *
     * @param userId the ID of the user
     * @return a ResponseEntity containing a list of ActivityDTOs
     */
    public ResponseEntity<List<ActivityDTO>> getUserActivities(@PathVariable Long userId) {
        return ResponseEntity.ok(activityService.getUserActivities(userId));
    }

    @GetMapping("/recent")
    /**
     * Retrieves the global feed of the most recent activities across the platform.
     *
     * @return a ResponseEntity containing a list of ActivityDTOs
     */
    public ResponseEntity<List<ActivityDTO>> getRecentActivities() {
        return ResponseEntity.ok(activityService.getRecentGlobalActivities());
    }
}
