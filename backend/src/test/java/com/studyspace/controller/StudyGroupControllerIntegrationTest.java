package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.CreateGroupRequest;
import com.studyspace.dto.StudyGroupDTO;
import com.studyspace.entity.User;
import com.studyspace.repository.StudyGroupRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.service.StudyGroupService;
import com.studyspace.types.AuthProvider;
import com.studyspace.types.GroupType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for StudyGroupController.
 * Uses real H2 database and tests full request/response cycle.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class StudyGroupControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudyGroupRepository groupRepository;

    @Autowired
    private StudyGroupService groupService;

    private User creator;
    private User member;
    private Long testGroupId;

    @BeforeEach
    void setUp() {
        // Create test users
        creator = User.builder()
                .username("creator")
                .email("creator@example.com")
                .password("password")
                .fullName("Group Creator")
                .authProvider(AuthProvider.LOCAL)
                .groups(new HashSet<>())
                .build();
        creator = userRepository.save(creator);

        member = User.builder()
                .username("member")
                .email("member@example.com")
                .password("password")
                .fullName("Group Member")
                .authProvider(AuthProvider.LOCAL)
                .groups(new HashSet<>())
                .build();
        member = userRepository.save(member);
    }

    @Test
    @WithMockUser
    void createGroup_Success() throws Exception {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("Integration Test Group");
        request.setDescription("Testing group creation");
        request.setGroupType(GroupType.PUBLIC);

        mockMvc.perform(post("/api/groups")
                        .param("creatorId", creator.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Integration Test Group"))
                .andExpect(jsonPath("$.creatorId").value(creator.getId()));

        // Verify group was created in database
        assertEquals(1, groupRepository.count());
    }

    @Test
    @WithMockUser
    void addMember_Success() throws Exception {
        // Use service to create group (proper entity management)
        testGroupId = createTestGroupViaService();

        // Add member via API
        mockMvc.perform(post("/api/groups/{id}/members/{userId}", 
                        testGroupId, member.getId()))
                .andExpect(status().isCreated());

        // Verify member was added
        StudyGroupDTO updated = groupService.getGroupById(testGroupId);
        assertTrue(updated.getMemberCount() >= 2);
    }

    @Test
    @WithMockUser
    void removeMember_SelfLeave() throws Exception {
        // Create group with member
        testGroupId = createTestGroupWithMemberViaService();

        // Member leaves
        mockMvc.perform(delete("/api/groups/{id}/members/{userId}", 
                        testGroupId, member.getId())
                        .param("requesterId", member.getId().toString()))
                .andExpect(status().isNoContent());

        // Verify member was removed
        StudyGroupDTO updated = groupService.getGroupById(testGroupId);
        assertEquals(1, updated.getMemberCount()); // Only creator left
    }

    @Test
    @WithMockUser
    void removeMember_CreatorKicks() throws Exception {
        // Create group with member
        testGroupId = createTestGroupWithMemberViaService();

        // Creator kicks member
        mockMvc.perform(delete("/api/groups/{id}/members/{userId}", 
                        testGroupId, member.getId())
                        .param("requesterId", creator.getId().toString()))
                .andExpect(status().isNoContent());

        // Verify member was removed
        StudyGroupDTO updated = groupService.getGroupById(testGroupId);
        assertEquals(1, updated.getMemberCount());
    }

    @Test
    @WithMockUser
    void transferOwnership_Success() throws Exception {
        // Create group with member
        testGroupId = createTestGroupWithMemberViaService();

        // Transfer ownership to member
        mockMvc.perform(put("/api/groups/{id}/transfer", testGroupId)
                        .param("newOwnerId", member.getId().toString()))
                .andExpect(status().isOk());

        // Verify ownership transferred
        StudyGroupDTO updated = groupService.getGroupById(testGroupId);
        assertEquals(member.getId(), updated.getCreatorId());
    }

    @Test
    @WithMockUser
    void transferOwnership_NonMember_Fails() throws Exception {
        // Create group (member not added)
        testGroupId = createTestGroupViaService();

        // Try to transfer to non-member
        mockMvc.perform(put("/api/groups/{id}/transfer", testGroupId)
                        .param("newOwnerId", member.getId().toString()))
                .andExpect(status().is4xxClientError()); // New owner must be member
    }

    @Test
    @WithMockUser
    void deleteGroup_Success() throws Exception {
        testGroupId = createTestGroupViaService();

        mockMvc.perform(delete("/api/groups/{id}", testGroupId))
                .andExpect(status().isNoContent());

        // Verify deleted
        assertFalse(groupRepository.existsById(testGroupId));
    }

    @Test
    @WithMockUser
    void getGroup_Success() throws Exception {
        testGroupId = createTestGroupViaService();

        mockMvc.perform(get("/api/groups/{id}", testGroupId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Group"))
                .andExpect(jsonPath("$.creatorId").value(creator.getId()));
    }

    // ============== HELPER METHODS ==============

    /**
     * Uses the service layer to create group, avoiding detached entity issues.
     */
    private Long createTestGroupViaService() {
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("Test Group");
        request.setDescription("Test Description");
        request.setGroupType(GroupType.PUBLIC);
        
        StudyGroupDTO dto = groupService.createGroup(creator.getId(), request);
        return dto.getId();
    }

    /**
     * Uses the service layer to create group and add member.
     */
    private Long createTestGroupWithMemberViaService() {
        Long groupId = createTestGroupViaService();
        groupService.addMember(groupId, member.getId());
        return groupId;
    }
}
