package com.studyspace.service;

import com.studyspace.entity.SessionParticipant;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.entity.Activity;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.SessionParticipantRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
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

    @InjectMocks
    private StudySessionService sessionService;

    @Test
    void deleteSession_RevertsUserMinutes() {
        // Setup User
        User user = new User();
        user.setId(1L);
        user.setTotalStudyMinutes(120); // Initial minutes

        // Setup Session
        StudySession session = new StudySession();
        session.setId(10L);

        // Setup Participant
        SessionParticipant participant = new SessionParticipant();
        participant.setUser(user);
        participant.setMinutesParticipated(60); // Minutes to revert
        participant.setStudySession(session);

        Set<SessionParticipant> participants = new HashSet<>();
        participants.add(participant);
        session.setParticipants(participants);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        // Execute
        sessionService.deleteSession(10L);

        // Verify
        // User should be saved with 120 - 60 = 60 minutes
        verify(userRepository).save(argThat(u -> u.getTotalStudyMinutes() == 60));
        
        // Session should be deleted
        verify(sessionRepository).delete(session);
    }

    @Test
    void deleteSession_NoMinutesToRevert() {
        // Setup User
        User user = new User();
        user.setId(1L);
        user.setTotalStudyMinutes(100);

        // Setup Session
        StudySession session = new StudySession();
        session.setId(10L);

        // Setup Participant with 0 minutes (e.g. joined but didn't stay)
        SessionParticipant participant = new SessionParticipant();
        participant.setUser(user);
        participant.setMinutesParticipated(0);
        participant.setStudySession(session);

        Set<SessionParticipant> participants = new HashSet<>();
        participants.add(participant);
        session.setParticipants(participants);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        // Execute
        sessionService.deleteSession(10L);

        // Verify
        // User should NOT be saved as minutes didn't change (or logic in service prevents 0 update?)
        // The service logic checks: callback -> if (min > 0)
        verify(userRepository, never()).save(any(User.class));
        
        // Session should be deleted
        verify(sessionRepository).delete(session);
    }

    // ============== NEW TESTS ==============

    @Test
    void transferHost_Success() {
        // Setup original host
        User originalHost = new User();
        originalHost.setId(1L);
        originalHost.setUsername("original_host");
        
        // Setup new host
        User newHost = new User();
        newHost.setId(2L);
        newHost.setUsername("new_host");
        newHost.setFullName("New Host User");

        // Setup Session
        StudySession session = new StudySession();
        session.setId(10L);
        session.setCreator(originalHost);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newHost));

        // Execute
        sessionService.transferHost(10L, 2L);

        // Verify
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

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        // Execute
        sessionService.addParticipant(10L, 1L);

        // Verify new participant was saved
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

        // Existing participant who left
        SessionParticipant existingParticipant = new SessionParticipant();
        existingParticipant.setId(5L);
        existingParticipant.setUser(user);
        existingParticipant.setStudySession(session);
        existingParticipant.setLeftAt(LocalDateTime.now().minusHours(1)); // Left an hour ago
        existingParticipant.setMinutesParticipated(30);

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(existingParticipant));

        // Execute
        sessionService.addParticipant(10L, 1L);

        // Verify participant was updated (rejoin)
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

        // Existing active participant (leftAt is null)
        SessionParticipant existingParticipant = new SessionParticipant();
        existingParticipant.setUser(user);
        existingParticipant.setStudySession(session);
        existingParticipant.setLeftAt(null); // Still active

        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(participantRepository.findByStudySessionIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(existingParticipant));

        // Execute
        sessionService.addParticipant(10L, 1L);

        // Verify no save was called (already active)
        verify(participantRepository, never()).save(any());
        verify(activityRepository, never()).save(any());
    }
}

