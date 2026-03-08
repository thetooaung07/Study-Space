package com.studyspace.service;

import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.util.DateTimeUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
        user.setLastStudyDate(DateTimeUtil.nowUtc().minusDays(1)); // Studied yesterday
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
        user.setLastStudyDate(DateTimeUtil.nowUtc().minusMinutes(30)); // Studied earlier today (same UTC day)
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
        user.setLastStudyDate(DateTimeUtil.nowUtc().minusDays(3)); // Studied 3 days ago (gap)
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
        user.setTotalStudyMinutes(65);
        user.setLastStudyDate(DateTimeUtil.nowUtc().minusDays(1));
        user.setCurrentStreak(2);

        StudySession session = new StudySession();
        session.setId(10L);

        gamificationService.processSessionCompletion(user, 30, session);

        verify(activityRepository).save(any(Activity.class));
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_NoMilestoneReached() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(45);
        user.setLastStudyDate(DateTimeUtil.nowUtc().minusDays(1));
        user.setCurrentStreak(2);

        StudySession session = new StudySession();
        session.setId(10L);

        gamificationService.processSessionCompletion(user, 30, session);

        verify(activityRepository, never()).save(any(Activity.class));
        verify(userRepository).save(user);
    }

    @Test
    void processSessionCompletion_AlreadyPastMilestone_NoNewActivity() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setTotalStudyMinutes(100); // After session: 100 minutes
        user.setLastStudyDate(DateTimeUtil.nowUtc().minusDays(1));
        user.setCurrentStreak(5);

        StudySession session = new StudySession();
        session.setId(10L);

        // Execute - user already past 60 min (previous: 70, no new milestone)
        gamificationService.processSessionCompletion(user, 30, session);

        // Verify no milestone activity was created (already past first hour)
        verify(activityRepository, never()).save(any(Activity.class));
    }
}
