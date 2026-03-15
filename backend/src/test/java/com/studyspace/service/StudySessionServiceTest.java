package com.studyspace.service;

import com.studyspace.entity.SessionParticipant;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.entity.Activity;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.SessionParticipantRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.mapper.UserMapper;
import com.studyspace.types.SessionStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudySessionServiceTest {

    @Mock
    private StudySessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SessionParticipantRepository participantRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private GamificationService gamificationService;

    @Mock
    private SessionNotificationService notificationService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private StudySessionService sessionService;

    @Test
    void deleteSession_RevertsUserMinutes() {
        User user = new User();
        user.setId(1L);
        user.setTotalStudyMinutes(120);

        StudySession session = new StudySession();
        session.setId(10L);

        SessionParticipant participant = new SessionParticipant();
        participant.setUser(user);
        participant.setMinutesParticipated(60);
        participant.setStudySession(session);

        Set<SessionParticipant> participants = new HashSet<>();
        participants.add(participant);
        session.setParticipants(participants);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        sessionService.deleteSession(10L);

        verify(userRepository).save(argThat(u -> u.getTotalStudyMinutes() == 60));
        verify(sessionRepository).delete(session);
    }

    @Test
    void deleteSession_NoMinutesToRevert() {
        User user = new User();
        user.setId(1L);
        user.setTotalStudyMinutes(100);

        StudySession session = new StudySession();
        session.setId(10L);

        SessionParticipant participant = new SessionParticipant();
        participant.setUser(user);
        participant.setMinutesParticipated(0);
        participant.setStudySession(session);

        Set<SessionParticipant> participants = new HashSet<>();
        participants.add(participant);
        session.setParticipants(participants);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        sessionService.deleteSession(10L);

        verify(userRepository, never()).save(any(User.class));
        verify(sessionRepository).delete(session);
    }

    @Test
    void transferHost_Success() {
        User originalHost = new User();
        originalHost.setId(1L);
        originalHost.setUsername("original_host");
        
        User newHost = new User();
        newHost.setId(2L);
        newHost.setUsername("new_host");
        newHost.setFullName("New Host User");

        StudySession session = new StudySession();
        session.setId(10L);
        session.setCreator(originalHost);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newHost));

        sessionService.transferHost(10L, 2L);

        verify(sessionRepository).save(argThat(s -> s.getCreator().equals(newHost)));
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void transferHost_SessionNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> sessionService.transferHost(99L, 2L));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void transferHost_UserNotFound() {
        StudySession session = new StudySession();
        session.setId(10L);
        
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> sessionService.transferHost(10L, 99L));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void addParticipant_NewParticipant() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setFullName("Test User");

        StudySession session = new StudySession();
        session.setId(10L);
        session.setCreator(user);
        session.setParticipants(new HashSet<>());

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        sessionService.addParticipant(10L, 1L);

        verify(participantRepository).save(argThat(p -> 
            p.getUser().equals(user) && p.getStudySession().equals(session)
        ));
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void addParticipant_RejoinAfterLeaving() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setFullName("Test User");

        StudySession session = new StudySession();
        session.setId(10L);

        SessionParticipant existingParticipant = new SessionParticipant();
        existingParticipant.setId(5L);
        existingParticipant.setUser(user);
        existingParticipant.setStudySession(session);
        existingParticipant.setLeftAt(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(1));
        existingParticipant.setMinutesParticipated(30);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(existingParticipant));

        sessionService.addParticipant(10L, 1L);

        verify(participantRepository).save(argThat(p -> 
            p.getLeftAt() == null && p.getMinutesParticipated() == null
        ));
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void addParticipant_AlreadyActive_NoAction() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        StudySession session = new StudySession();
        session.setId(10L);

        SessionParticipant existingParticipant = new SessionParticipant();
        existingParticipant.setUser(user);
        existingParticipant.setStudySession(session);
        existingParticipant.setLeftAt(null);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(existingParticipant));

        sessionService.addParticipant(10L, 1L);

        verify(participantRepository, never()).save(any());
        verify(activityRepository, never()).save(any());
    }

    @Test
    void pauseParticipant_Success() {
        User user = new User();
        user.setId(1L);

        StudySession session = new StudySession();
        session.setId(10L);
        session.setCreator(user);
        session.setParticipants(new HashSet<>());

        SessionParticipant participant = new SessionParticipant();
        participant.setUser(user);
        participant.setStudySession(session);
        participant.setLastPausedAt(null);
        participant.setTotalPausedSeconds(0L);

        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(participant));

        sessionService.pauseParticipant(10L, 1L);

        verify(participantRepository).save(argThat(p -> p.getLastPausedAt() != null));
    }

    @Test
    void resumeParticipant_Success() {
        User user = new User();
        user.setId(1L);

        StudySession session = new StudySession();
        session.setId(10L);
        session.setCreator(user);
        session.setParticipants(new HashSet<>());

        SessionParticipant participant = new SessionParticipant();
        participant.setUser(user);
        participant.setStudySession(session);
        participant.setLastPausedAt(com.studyspace.util.DateTimeUtil.nowUtc().minusMinutes(5));
        participant.setTotalPausedSeconds(0L);

        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(participant));

        sessionService.resumeParticipant(10L, 1L);

        verify(participantRepository).save(argThat(p -> 
            p.getLastPausedAt() == null && p.getTotalPausedSeconds() > 0
        ));
    }

}
