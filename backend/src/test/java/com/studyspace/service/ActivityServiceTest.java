package com.studyspace.service;

import com.studyspace.dto.ActivityDTO;
import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.ActivityType;
import com.studyspace.types.SessionVisibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private StudySessionRepository sessionRepository;
    @Mock private UserRepository userRepository;
    @Mock private SessionNotificationService notificationService;

    @InjectMocks
    private ActivityService activityService;

    private User user;
    private StudySession session;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).fullName("Alice").build();
        session = StudySession.builder()
                .id(5L)
                .visibility(SessionVisibility.PUBLIC)
                .build();
    }

    // ─── createActivity ──────────────────────────────────────────────────────────

    @Test
    void createActivity_Success_BroadcastsCalled() {
        Activity saved = Activity.builder()
                .id(1L)
                .type(ActivityType.MESSAGE)
                .message("Hello!")
                .studySession(session)
                .user(user)
                .timestamp(LocalDateTime.now())
                .build();

        when(sessionRepository.findById(5L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(activityRepository.save(any(Activity.class))).thenReturn(saved);

        ActivityDTO result = activityService.createActivity(5L, 1L, ActivityType.MESSAGE, "Hello!");

        assertNotNull(result);
        assertEquals(ActivityType.MESSAGE, result.getType());
        assertEquals("Hello!", result.getMessage());
        // Broadcast must always be called after a successful save
        verify(notificationService).broadcastActivity(eq(5L), any(ActivityDTO.class));
    }

    @Test
    void createActivity_SessionNotFound_ThrowsException() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> activityService.createActivity(99L, 1L, ActivityType.MESSAGE, "Hi"));
        verify(notificationService, never()).broadcastActivity(any(), any());
    }

    @Test
    void createActivity_UserNotFound_ThrowsException() {
        when(sessionRepository.findById(5L)).thenReturn(Optional.of(session));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> activityService.createActivity(5L, 99L, ActivityType.MESSAGE, "Hi"));
    }

    // ─── getSessionActivities ────────────────────────────────────────────────────

    @Test
    void getSessionActivities_ReturnsList() {
        Activity a1 = Activity.builder().id(1L).type(ActivityType.JOINED).user(user)
                .studySession(session).timestamp(LocalDateTime.now()).build();
        Activity a2 = Activity.builder().id(2L).type(ActivityType.MESSAGE).user(user)
                .studySession(session).timestamp(LocalDateTime.now()).build();

        when(activityRepository.findByStudySessionId(5L)).thenReturn(List.of(a1, a2));

        List<ActivityDTO> result = activityService.getSessionActivities(5L);

        assertEquals(2, result.size());
    }

    // ─── getUserActivities ────────────────────────────────────────────────────────

    @Test
    void getUserActivities_ReturnsList() {
        Activity a = Activity.builder().id(3L).type(ActivityType.JOINED).user(user)
                .studySession(session).timestamp(LocalDateTime.now()).build();

        when(activityRepository.findByUserId(1L)).thenReturn(List.of(a));

        List<ActivityDTO> result = activityService.getUserActivities(1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getUserId());
    }

    // ─── getRecentGlobalActivities ────────────────────────────────────────────────

    @Test
    void getRecentGlobalActivities_ExcludesPrivateSessions() {
        StudySession privateSession = StudySession.builder()
                .id(6L)
                .visibility(SessionVisibility.PRIVATE)
                .build();

        Activity publicActivity = Activity.builder().id(10L).type(ActivityType.JOINED).user(user)
                .studySession(session).timestamp(LocalDateTime.now()).build();
        Activity privateActivity = Activity.builder().id(11L).type(ActivityType.JOINED).user(user)
                .studySession(privateSession).timestamp(LocalDateTime.now()).build();

        when(activityRepository.findTop20ByOrderByTimestampDesc())
                .thenReturn(List.of(publicActivity, privateActivity));

        List<ActivityDTO> result = activityService.getRecentGlobalActivities();

        // Only the public session activity should be returned
        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getSessionId());
    }

    @Test
    void getRecentGlobalActivities_IncludesActivitiesWithNullSession() {
        // Activities without a session (null session) should also be included
        Activity noSession = Activity.builder().id(12L).type(ActivityType.MESSAGE).user(user)
                .studySession(null).timestamp(LocalDateTime.now()).build();

        when(activityRepository.findTop20ByOrderByTimestampDesc()).thenReturn(List.of(noSession));

        List<ActivityDTO> result = activityService.getRecentGlobalActivities();

        assertEquals(1, result.size());
        assertNull(result.get(0).getSessionId());
    }
}
