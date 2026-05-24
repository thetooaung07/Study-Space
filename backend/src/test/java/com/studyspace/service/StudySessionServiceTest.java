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
import com.studyspace.dto.UserDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.List;
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
        when(userMapper.toDTO(any())).thenReturn(new UserDTO());

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
        session.setCreator(user);
        
        SessionParticipant existingParticipant = new SessionParticipant();
        existingParticipant.setId(5L);
        existingParticipant.setUser(user);
        existingParticipant.setStudySession(session);
        existingParticipant.setLeftAt(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(1));
        existingParticipant.setMinutesParticipated(30);

        Set<SessionParticipant> participants = new HashSet<>();
        participants.add(existingParticipant);
        session.setParticipants(participants);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(existingParticipant));
        when(userMapper.toDTO(any())).thenReturn(new UserDTO());

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
    void addParticipant_SessionNotFound_ThrowsException() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> sessionService.addParticipant(99L, 1L));
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

    @Test
    void pauseParticipant_NotParticipant_ThrowsException() {
        when(participantRepository.findByStudySessionIdAndUserId(10L, 99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> sessionService.pauseParticipant(10L, 99L));
    }

    @Test
    void resumeParticipant_NotPaused_NoAction() {
        SessionParticipant participant = new SessionParticipant();
        participant.setLastPausedAt(null); // Not paused
        
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L)).thenReturn(Optional.of(participant));

        sessionService.resumeParticipant(10L, 1L);
        verify(participantRepository, never()).save(any());
    }

    @Test
    void getAllSessions_ReturnsSortedSessions() {
        StudySession session1 = new StudySession();
        session1.setId(1L);
        session1.setStartTime(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(2));
        User u1 = new User(); u1.setId(1L); session1.setCreator(u1); session1.setParticipants(new HashSet<>());

        StudySession session2 = new StudySession();
        session2.setId(2L);
        session2.setStartTime(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(1));
        session2.setCreator(u1); session2.setParticipants(new HashSet<>());

        when(sessionRepository.findAll()).thenReturn(java.util.Arrays.asList(session1, session2));
        when(userMapper.toDTO(any())).thenReturn(new UserDTO());

        List<com.studyspace.dto.StudySessionDTO> result = sessionService.getAllSessions();

        assertEquals(2, result.size());
        assertEquals(2L, result.get(0).getId()); // newest first
        assertEquals(1L, result.get(1).getId());
    }

    @Test
    void getUserSessions_ReturnsCreatedAndJoined() {
        User creator = new User(); creator.setId(1L);

        StudySession createdSession = new StudySession();
        createdSession.setId(10L);
        createdSession.setStartTime(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(1));
        createdSession.setCreator(creator);
        createdSession.setParticipants(new HashSet<>());

        StudySession joinedSession = new StudySession();
        joinedSession.setId(20L);
        joinedSession.setStartTime(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(2));
        User otherCreator = new User(); otherCreator.setId(2L);
        joinedSession.setCreator(otherCreator);
        joinedSession.setParticipants(new HashSet<>());

        SessionParticipant participant = new SessionParticipant();
        participant.setStudySession(joinedSession);
        participant.setUser(creator);

        when(sessionRepository.findByCreatorId(1L)).thenReturn(java.util.Collections.singletonList(createdSession));
        when(participantRepository.findByUserId(1L)).thenReturn(java.util.Collections.singletonList(participant));
        when(userMapper.toDTO(any())).thenReturn(new UserDTO());

        List<com.studyspace.dto.StudySessionDTO> result = sessionService.getUserSessions(1L);

        assertEquals(2, result.size());
        assertEquals(10L, result.get(0).getId()); // newer
        assertEquals(20L, result.get(1).getId()); // older
    }

    @Test
    void getUserSessionHistory_ReturnsCompletedSessions() {
        User user = new User(); user.setId(1L);

        StudySession s1 = new StudySession();
        s1.setId(1L); s1.setStatus(SessionStatus.COMPLETED); s1.setCreator(user);
        s1.setEndTime(com.studyspace.util.DateTimeUtil.nowUtc().minusHours(1));
        s1.setParticipants(new HashSet<>());

        StudySession s2 = new StudySession();
        s2.setId(2L); s2.setStatus(SessionStatus.ACTIVE); s2.setCreator(user);

        when(sessionRepository.findByCreatorId(1L)).thenReturn(java.util.Arrays.asList(s1, s2));
        when(userMapper.toDTO(any())).thenReturn(new UserDTO());

        List<com.studyspace.dto.StudySessionDTO> result = sessionService.getUserSessionHistory(1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getGroupSessions_FiltersProperly() {
        User user1 = new User(); user1.setId(1L);
        User user2 = new User(); user2.setId(2L);

        StudySession publicSession = new StudySession();
        publicSession.setId(1L);
        publicSession.setVisibility(com.studyspace.types.SessionVisibility.PUBLIC);
        publicSession.setCreator(user2);
        publicSession.setParticipants(new HashSet<>());

        StudySession privateSessionMine = new StudySession();
        privateSessionMine.setId(2L);
        privateSessionMine.setVisibility(com.studyspace.types.SessionVisibility.PRIVATE);
        privateSessionMine.setCreator(user1);
        privateSessionMine.setParticipants(new HashSet<>());

        StudySession privateSessionOther = new StudySession();
        privateSessionOther.setId(3L);
        privateSessionOther.setVisibility(com.studyspace.types.SessionVisibility.PRIVATE);
        privateSessionOther.setCreator(user2);
        privateSessionOther.setParticipants(new HashSet<>());

        when(sessionRepository.findByStudyGroupId(10L)).thenReturn(
            java.util.Arrays.asList(publicSession, privateSessionMine, privateSessionOther)
        );
        when(userMapper.toDTO(any())).thenReturn(new UserDTO());

        List<com.studyspace.dto.StudySessionDTO> result = sessionService.getGroupSessions(10L, 1L);

        assertEquals(2, result.size());
        assertTrue(result.stream().anyMatch(s -> s.getId().equals(1L)));
        assertTrue(result.stream().anyMatch(s -> s.getId().equals(2L)));
    }
}
