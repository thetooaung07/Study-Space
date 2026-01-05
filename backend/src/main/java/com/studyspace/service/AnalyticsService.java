package com.studyspace.service;

import com.studyspace.dto.AnalyticsOverviewDTO;
import com.studyspace.repository.StudyGroupRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.UserStatus;
import com.studyspace.util.DateTimeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository userRepository;
    private final StudySessionRepository sessionRepository;
    private final StudyGroupRepository groupRepository;

    public AnalyticsOverviewDTO getOverview() {
        long activeUsers = userRepository.countByCurrentStatus(UserStatus.STUDYING);
        long totalStudyMinutes = userRepository.sumTotalStudyMinutes(); 
        long hotSessions = sessionRepository.countByStartTimeAfter(DateTimeUtil.nowUtc().minusHours(24)); 
        long newGroups = groupRepository.countByCreatedAtAfter(DateTimeUtil.nowUtc().minusHours(24)); 

        return AnalyticsOverviewDTO.builder()
                .activeUsersNow(activeUsers)
                .totalStudyMinutes(totalStudyMinutes)
                .hotSessionsCount(hotSessions)
                .newGroupsToday(newGroups)
                .build();
    }
}
