package com.studyspace.service;

import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private GamificationService gamificationService;

    // ============== STREAK TESTS ==============

    @Test
    void processSessionCompletion_FirstTimeUser_StreakStartsAt1() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(30);
        user.setLastStudyDate(null); // Never studied before
        user.setCurrentStreak(null);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify streak was set to 1
        assertEquals(1, user.getCurrentStreak());
        assertNotNull(user.getLastStudyDate());
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_ConsecutiveDay_StreakIncrements() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(60);
        user.setLastStudyDate(LocalDateTime.now().minusDays(1)); // Studied yesterday
        user.setCurrentStreak(5);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify streak incremented
        assertEquals(6, user.getCurrentStreak());
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_SameDayStudy_StreakUnchanged() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(90);
        user.setLastStudyDate(LocalDateTime.now().minusHours(2)); // Studied earlier today
        user.setCurrentStreak(3);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify streak unchanged
        assertEquals(3, user.getCurrentStreak());
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_GapInDays_StreakResets() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(120);
        user.setLastStudyDate(LocalDateTime.now().minusDays(3)); // Studied 3 days ago (gap)
        user.setCurrentStreak(10);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify streak reset to 1
        assertEquals(1, user.getCurrentStreak());
        verify(userRepository).save(user);
    }

    // ============== MILESTONE TESTS ==============

    @Test
    void processSessionCompletion_ReachesFirstHourMilestone() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(65); // After session: 65 minutes (>= 60)
        user.setLastStudyDate(LocalDateTime.now().minusDays(1));
        user.setCurrentStreak(2);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute - user just crossed 60 minute threshold
        // Previous was 65-30=35, new is 65 (crossed 60)
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify milestone activity was created
        verify(activityRepository).save(any(Activity.class));
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_NoMilestoneReached() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(45); // After session: 45 minutes (< 60)
        user.setLastStudyDate(LocalDateTime.now().minusDays(1));
        user.setCurrentStreak(2);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute - user at 45 minutes (previous: 15, no milestone crossed)
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify no milestone activity was created
        verify(activityRepository, never()).save(any(Activity.class));
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_AlreadyPastMilestone_NoNewActivity() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(100); // After session: 100 minutes
        user.setLastStudyDate(LocalDateTime.now().minusDays(1));
        user.setCurrentStreak(5);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute - user already past 60 min (previous: 70, no new milestone)
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify no milestone activity was created (already past first hour)
        verify(activityRepository, never()).save(any(Activity.class));
    }
}
