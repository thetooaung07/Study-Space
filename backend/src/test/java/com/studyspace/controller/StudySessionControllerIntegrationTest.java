package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.CreateSessionRequest;
import com.studyspace.entity.SessionParticipant;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.SessionParticipantRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.AuthProvider;
import com.studyspace.types.SessionStatus;
import com.studyspace.types.Subject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for StudySessionController.
 * Uses real H2 database and tests full request/response cycle.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class StudySessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudySessionRepository sessionRepository;

    @Autowired
    private SessionParticipantRepository participantRepository;

    private User testUser;
    private User testUser2;
    private StudySession testSession;

    @BeforeEach
    void setUp() {
        // Create test users
        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password")
                .fullName("Test User")
                .totalStudyMinutes(0)
                .authProvider(AuthProvider.LOCAL)
                .build();
        testUser = userRepository.save(testUser);

        testUser2 = User.builder()
                .username("testuser2")
                .email("test2@example.com")
                .password("password")
                .fullName("Test User 2")
                .totalStudyMinutes(0)
                .authProvider(AuthProvider.LOCAL)
                .build();
        testUser2 = userRepository.save(testUser2);
    }

    @Test
    @WithMockUser
    void createSession_Success() throws Exception {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setTitle("Integration Test Session");
        request.setDescription("Testing session creation");
        request.setSubject(Subject.PROGRAMMING);

        mockMvc.perform(post("/api/sessions")
                        .param("userId", testUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Integration Test Session"))
                .andExpect(jsonPath("$.creatorId").value(testUser.getId()));

        // Verify session was created in database
        assertEquals(1, sessionRepository.count());
    }

    @Test
    @WithMockUser
    void addParticipant_Success() throws Exception {
        // Create a session first
        testSession = StudySession.builder()
                .title("Test Session")
                .creator(testUser)
                .status(SessionStatus.ACTIVE)
                .startTime(LocalDateTime.now())
                .build();
        testSession = sessionRepository.save(testSession);

        // Add participant
        mockMvc.perform(post("/api/sessions/{id}/participants/{userId}", 
                        testSession.getId(), testUser2.getId()))
                .andExpect(status().isCreated());

        // Verify participant was added
        assertTrue(participantRepository.findByStudySessionIdAndUserId(
                testSession.getId(), testUser2.getId()).isPresent());
    }

    @Test
    @WithMockUser
    void removeParticipant_WithStudyMinutes() throws Exception {
        // Create session and add participant
        testSession = StudySession.builder()
                .title("Test Session")
                .creator(testUser)
                .status(SessionStatus.ACTIVE)
                .startTime(LocalDateTime.now())
                .build();
        testSession = sessionRepository.save(testSession);

        SessionParticipant participant = SessionParticipant.builder()
                .studySession(testSession)
                .user(testUser2)
                .joinedAt(LocalDateTime.now().minusMinutes(30))
                .build();
        participantRepository.save(participant);

        // Remove participant with study minutes
        mockMvc.perform(delete("/api/sessions/{id}/participants/{userId}", 
                        testSession.getId(), testUser2.getId())
                        .param("studyMinutes", "30"))
                .andExpect(status().isNoContent());

        // Verify participant record was updated
        SessionParticipant updated = participantRepository
                .findByStudySessionIdAndUserId(testSession.getId(), testUser2.getId())
                .orElseThrow();
        assertNotNull(updated.getLeftAt());
        assertEquals(30, updated.getMinutesParticipated());

        // Verify user's total minutes updated
        User refreshedUser = userRepository.findById(testUser2.getId()).orElseThrow();
        assertEquals(30, refreshedUser.getTotalStudyMinutes());
    }

    @Test
    @WithMockUser
    void transferHost_Success() throws Exception {
        // Create session with testUser as creator
        testSession = StudySession.builder()
                .title("Test Session")
                .creator(testUser)
                .status(SessionStatus.ACTIVE)
                .startTime(LocalDateTime.now())
                .build();
        testSession = sessionRepository.save(testSession);

        // Transfer to testUser2
        mockMvc.perform(put("/api/sessions/{id}/transfer", testSession.getId())
                        .param("newHostId", testUser2.getId().toString()))
                .andExpect(status().isOk());

        // Verify host was transferred
        StudySession updated = sessionRepository.findById(testSession.getId()).orElseThrow();
        assertEquals(testUser2.getId(), updated.getCreator().getId());
    }

    @Test
    @WithMockUser
    void getSession_NotFound() throws Exception {
        mockMvc.perform(get("/api/sessions/9999"))
                .andExpect(status().is4xxClientError()); // Session not found returns 4xx
    }

    @Test
    @WithMockUser
    void pauseAndResumeParticipant_Success() throws Exception {
        // Create session and add participant
        testSession = StudySession.builder()
                .title("Test Session")
                .creator(testUser)
                .status(SessionStatus.ACTIVE)
                .startTime(LocalDateTime.now())
                .build();
        testSession = sessionRepository.save(testSession);

        SessionParticipant participant = SessionParticipant.builder()
                .studySession(testSession)
                .user(testUser2)
                .joinedAt(LocalDateTime.now())
                .build();
        participantRepository.save(participant);

        // Pause
        mockMvc.perform(put("/api/sessions/{id}/participants/{userId}/pause", 
                        testSession.getId(), testUser2.getId()))
                .andExpect(status().isOk());

        // Verify paused
        SessionParticipant paused = participantRepository
                .findByStudySessionIdAndUserId(testSession.getId(), testUser2.getId())
                .orElseThrow();
        assertNotNull(paused.getLastPausedAt());

        // Resume
        mockMvc.perform(put("/api/sessions/{id}/participants/{userId}/resume", 
                        testSession.getId(), testUser2.getId()))
                .andExpect(status().isOk());
    }
}
