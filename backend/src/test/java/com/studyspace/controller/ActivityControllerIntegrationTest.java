package com.studyspace.controller;

import com.studyspace.entity.Activity;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.ActivityRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.ActivityType;
import com.studyspace.types.SessionStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ActivityControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private StudySessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private StudySession testSession;
    private Activity testActivity;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password")
                .fullName("Test User")
                .build();
        testUser = userRepository.save(testUser);

        testSession = StudySession.builder()
                .title("Test Session")
                .creator(testUser)
                .status(SessionStatus.ACTIVE)
                .build();
        testSession = sessionRepository.save(testSession);

        testActivity = Activity.builder()
                .type(ActivityType.JOINED)
                .user(testUser)
                .studySession(testSession)
                .message("joined the session")
                .build();
        testActivity = activityRepository.save(testActivity);
    }

    @AfterEach
    void tearDown() {
        activityRepository.deleteAll();
        sessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @WithMockUser
    void getActivitiesBySession_Success() throws Exception {
        mockMvc.perform(get("/api/activities/session/{sessionId}", testSession.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type", is("JOINED")))
                .andExpect(jsonPath("$[0].message", is("joined the session")));
    }

    @Test
    @WithMockUser
    void getActivitiesByUser_Success() throws Exception {
        mockMvc.perform(get("/api/activities/user/{userId}", testUser.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type", is("JOINED")));
    }

    @Test
    @WithMockUser
    void getRecentActivities_Success() throws Exception {
        mockMvc.perform(get("/api/activities/recent")
                        .param("limit", "10"))
                .andExpect(status().isOk());
    }
}
