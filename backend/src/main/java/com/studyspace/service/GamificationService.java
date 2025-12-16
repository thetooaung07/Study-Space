package com.studyspace.service;

import com.studyspace.entity.Activity;
import com.studyspace.entity.User;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.ActivityType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
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
     *
     * @param user User entity to update
     * @param sessionMinutes Minutes spent in the just-finished session
     */
    public void processSessionCompletion(User user, int sessionMinutes) {
        updateStreak(user);
        checkAchievements(user, sessionMinutes);
        userRepository.save(user);
    }

    private void updateStreak(User user) {
        LocalDate today = LocalDate.now();
        LocalDate lastStudyDate = user.getLastStudyDate() != null ? user.getLastStudyDate().toLocalDate() : null;
        
        if (lastStudyDate == null) {
            // First time studying
            user.setCurrentStreak(1);
        } else if (lastStudyDate.equals(today.minusDays(1))) {
            // Studied yesterday, increment streak
            user.setCurrentStreak((user.getCurrentStreak() != null ? user.getCurrentStreak() : 0) + 1);
        } else if (lastStudyDate.isBefore(today.minusDays(1))) {
            // Broke the streak (didn't study yesterday), reset to 1 (since studing today)
            user.setCurrentStreak(1);
        }
        // If studied today already, keep streak as is
        
        user.setLastStudyDate(LocalDateTime.now());
    }

    private void checkAchievements(User user, int sessionMinutes) {
        int totalMinutes = user.getTotalStudyMinutes() != null ? user.getTotalStudyMinutes() : 0;
        int previousMinutes = totalMinutes - sessionMinutes; // Estimate previous total
        
        // Simple milestone checks - logging activities if crossed a threshold
        checkAndLogMilestone(user, previousMinutes, totalMinutes, MILESTONE_1_HOUR, "First Hour of Power!");
        checkAndLogMilestone(user, previousMinutes, totalMinutes, MILESTONE_10_HOURS, "Dedication Unlock: 10 Hours!");
        checkAndLogMilestone(user, previousMinutes, totalMinutes, MILESTONE_100_HOURS, "Master Scholar: 100 Hours!");
    }
    
    private void checkAndLogMilestone(User user, int oldTotal, int newTotal, int threshold, String message) {
        if (oldTotal < threshold && newTotal >= threshold) {
            Activity milestone = Activity.builder()
                .user(user)
                .type(ActivityType.MILESTONE_REACHED)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
            activityRepository.save(milestone);
        }
    }
}
