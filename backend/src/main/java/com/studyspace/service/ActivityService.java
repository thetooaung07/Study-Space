package com.studyspace.service;

import com.studyspace.dto.ActivityDTO;
import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.types.ActivityType;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;

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
        return convertToDTO(savedActivity);
    }

    @Transactional(readOnly = true)
    public List<ActivityDTO> getSessionActivities(Long sessionId) {
        return activityRepository.findByStudySessionId(sessionId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityDTO> getUserActivities(Long userId) {
        return activityRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityDTO> getRecentGlobalActivities() {
        return activityRepository.findTop20ByOrderByTimestampDesc().stream()
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
