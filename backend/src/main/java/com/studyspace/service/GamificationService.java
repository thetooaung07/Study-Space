package com.studyspace.service;

import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.ActivityType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class GamificationService {
    
    // Milestones definition
    private static final int MILESTONE_1_HOUR = 60;
    private static final int MILESTONE_10_HOURS = 600;
    private static final int MILESTONE_100_HOURS = 6000;

    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;

    /**
     * Processes gamification logic when a user finishes studying.
     * Updates streaks and checks for achievements.
     */
    public void processSessionCompletion(User user, int sessionMinutes, StudySession session) {
        // log.info("Processing stats for user: {} (ID: {}), session minutes: {}", 
            // user.getUsername(), user.getId(), sessionMinutes);
        
        updateStreak(user);
        checkAchievements(user, sessionMinutes, session);
        userRepository.save(user);
        
        log.debug("Stats processing complete for user: {} - Current streak: {}, Total minutes: {}", 
            user.getUsername(), user.getCurrentStreak(), user.getTotalStudyMinutes());
    }

    private void updateStreak(User user) {
        LocalDate today = LocalDate.now();
        LocalDate lastStudyDate = user.getLastStudyDate() != null ? user.getLastStudyDate().toLocalDate() : null;
        Integer previousStreak = user.getCurrentStreak();
        
        log.debug("Updating streak for user: {} - Last study date: {}, Previous streak: {}", 
            user.getUsername(), lastStudyDate, previousStreak);
        
        if (lastStudyDate == null) {
            user.setCurrentStreak(1);
            log.info("User {} started first streak (streak: 1)", user.getUsername());
        } else if (lastStudyDate.equals(today.minusDays(1))) {
            user.setCurrentStreak((user.getCurrentStreak() != null ? user.getCurrentStreak() : 0) + 1);
            log.info("User {} continued streak: {} -> {}", user.getUsername(), previousStreak, user.getCurrentStreak());
        } else if (lastStudyDate.equals(today)) {
            log.debug("User {} already studied today, streak unchanged: {}", user.getUsername(), user.getCurrentStreak());
        } else if (lastStudyDate.isBefore(today.minusDays(1))) {
            user.setCurrentStreak(1);
            log.info("User {} broke streak (last studied: {}), reset to 1", user.getUsername(), lastStudyDate);
        }
        
        user.setLastStudyDate(LocalDateTime.now());
    }

    private void checkAchievements(User user, int sessionMinutes, StudySession session) {
        int totalMinutes = user.getTotalStudyMinutes() != null ? user.getTotalStudyMinutes() : 0;
        int previousMinutes = totalMinutes - sessionMinutes;
        
        log.debug("Checking achievements for user: {} - Previous total: {} min, New total: {} min", 
            user.getUsername(), previousMinutes, totalMinutes);
       
        checkAndLogMilestone(user, previousMinutes, totalMinutes, MILESTONE_1_HOUR, "First Hour of Power!", session);
        checkAndLogMilestone(user, previousMinutes, totalMinutes, MILESTONE_10_HOURS, "Dedication Unlock: 10 Hours!", session);
        checkAndLogMilestone(user, previousMinutes, totalMinutes, MILESTONE_100_HOURS, "Master Scholar: 100 Hours!", session);
    }
    
    private void checkAndLogMilestone(User user, int oldTotal, int newTotal, int threshold, String message, StudySession session) {
        if (oldTotal < threshold && newTotal >= threshold) {
            log.info("🎉 MILESTONE REACHED! User: {} (ID: {}) - {} ({}+ minutes)", 
                user.getUsername(), user.getId(), message, threshold);
            
            Activity milestone = Activity.builder()
                .user(user)
                .type(ActivityType.MILESTONE_REACHED)
                .message(message)
                .studySession(session)
                .timestamp(LocalDateTime.now())
                .build();
            activityRepository.save(milestone);
            
            log.debug("Milestone activity saved for user: {}, message: {}", user.getUsername(), message);
        }
    }
}

