package com.studyspace.service;

import com.studyspace.dto.ActivityDTO;
import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.types.ActivityType;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
/**
 * Service handling business logic for tracking user activities and broadcasting updates.
 *
 * <p>Integrates with the SessionNotificationService to push real-time updates via WebSockets.
 */
public class ActivityService {

    /**
     * Constructor.
     * @param activityRepository the activityRepository
     * @param sessionRepository the sessionRepository
     * @param userRepository the userRepository
     * @param notificationService the notificationService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public ActivityService(ActivityRepository activityRepository, StudySessionRepository sessionRepository, UserRepository userRepository, SessionNotificationService notificationService) {
        this.activityRepository = activityRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    private final ActivityRepository activityRepository;
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SessionNotificationService notificationService;
    /**
     * Creates and logs a new user activity, broadcasting it in real-time to active session subscribers.
     *
     * @param sessionId the ID of the study session where the activity occurred
     * @param userId the ID of the user performing the activity
     * @param type the enum type categorizing the activity (e.g., JOIN, MESSAGE)
     * @param message an optional string for activity details
     * @return the logged ActivityDTO
     * @throws RuntimeException if the session or user cannot be found
     */
    public ActivityDTO createActivity(Long sessionId, Long userId, ActivityType type, String message) {
        StudySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Activity activity = Activity.builder()
                .type(type)
                .message(message)
                .studySession(session)
                .user(user)
                .build();

        Activity savedActivity = activityRepository.save(activity);
        ActivityDTO dto = convertToDTO(savedActivity);
        
        // Broadcast real-time activity to all session subscribers
        notificationService.broadcastActivity(sessionId, dto);
        
        return dto;
    }

    @Transactional(readOnly = true)
    /**
     * Retrieves the complete history of activities for a specific study session.
     *
     * @param sessionId the ID of the study session
     * @return a list of ActivityDTOs representing the session timeline
     */
    public List<ActivityDTO> getSessionActivities(Long sessionId) {
        return activityRepository.findByStudySessionId(sessionId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    /**
     * Retrieves a history of all activities performed by a specific user across all sessions.
     *
     * @param userId the ID of the user
     * @return a list of ActivityDTOs representing the user's activity log
     */
    public List<ActivityDTO> getUserActivities(Long userId) {
        return activityRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    /**
     * Retrieves the 50 most recent activities across the entire platform.
     *
     * @return a list of the 50 most recent ActivityDTOs globally
     */
    public List<ActivityDTO> getRecentGlobalActivities() {
        return activityRepository.findTop20ByOrderByTimestampDesc().stream()
                .filter(activity -> {
                    // Exclude activities from private sessions
                    StudySession session = activity.getStudySession();
                    return session == null || 
                           session.getVisibility() == com.studyspace.types.SessionVisibility.PUBLIC;
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ActivityDTO convertToDTO(Activity activity) {
        return ActivityDTO.builder()
                .id(activity.getId())
                .type(activity.getType())
                .message(activity.getMessage())
                .timestamp(activity.getTimestamp())
                .sessionId(activity.getStudySession() != null ? activity.getStudySession().getId() : null)
                .userId(activity.getUser().getId())
                .userName(activity.getUser().getFullName()) // Using full name for display
                .userProfilePictureUrl(activity.getUser().getProfilePictureUrl())
                .build();
    }
}
