package com.studyspace.service;

import com.studyspace.dto.AnalyticsOverviewDTO;
import com.studyspace.repository.StudyGroupRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudySessionRepository sessionRepository;

    @Mock
    private StudyGroupRepository groupRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void getOverview_ReturnsCorrectStats() {
        when(userRepository.countByCurrentStatus(UserStatus.STUDYING)).thenReturn(10L);
        when(userRepository.sumTotalStudyMinutes()).thenReturn(1500L);
        when(sessionRepository.countByStartTimeAfter(any(LocalDateTime.class))).thenReturn(5L);
        when(groupRepository.countByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(2L);

        AnalyticsOverviewDTO overview = analyticsService.getOverview();

        assertNotNull(overview);
        assertEquals(10L, overview.getActiveUsersNow());
        assertEquals(1500L, overview.getTotalStudyMinutes());
        assertEquals(5L, overview.getHotSessionsCount());
        assertEquals(2L, overview.getNewGroupsToday());
    }
}
