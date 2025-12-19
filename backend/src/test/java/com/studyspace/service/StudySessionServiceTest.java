package com.studyspace.service;

import com.studyspace.entity.SessionParticipant;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudySessionServiceTest {

    @Mock
    private StudySessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

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
}
