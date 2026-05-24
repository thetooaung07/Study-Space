package com.studyspace.controller;
import com.studyspace.dto.StudyGroupDTO;
import com.studyspace.service.StudyGroupService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class StudyGroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StudyGroupService groupService;

    @Test
    @WithMockUser
    void getAllGroups_ReturnsList() throws Exception {
        StudyGroupDTO group = StudyGroupDTO.builder()
                .id(1L)
                .name("Test Group")
                .description("A test group")
                .memberCount(5)
                .build();

        given(groupService.getAllGroups()).willReturn(Collections.singletonList(group));

        mockMvc.perform(get("/api/groups")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Group"));
    }

    @Test
    @WithMockUser
    void getGroup_ReturnsGroup() throws Exception {
        StudyGroupDTO group = StudyGroupDTO.builder()
                .id(1L)
                .name("Single Group")
                .build();
        
        given(groupService.getGroupById(1L)).willReturn(group);

        mockMvc.perform(get("/api/groups/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Single Group"));
    }

    @Test
    @WithMockUser
    void updateGroup_ReturnsUpdatedGroup() throws Exception {
        com.studyspace.dto.CreateGroupRequest req = new com.studyspace.dto.CreateGroupRequest();
        req.setName("Updated Group");

        StudyGroupDTO group = StudyGroupDTO.builder().id(1L).name("Updated Group").build();
        given(groupService.updateGroup(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any())).willReturn(group);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/groups/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Updated Group\",\"description\":\"Desc\",\"groupType\":\"PUBLIC\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Group"));
    }

    @Test
    @WithMockUser
    void getGroupDetails_ReturnsDetails() throws Exception {
        StudyGroupDTO groupDto = StudyGroupDTO.builder().id(1L).name("Details Group").build();
        com.studyspace.dto.StudyGroupDetailsDTO details = com.studyspace.dto.StudyGroupDetailsDTO.builder()
                .group(groupDto)
                .build();
        
        given(groupService.getGroupDetails(1L, 10L)).willReturn(details);

        mockMvc.perform(get("/api/groups/1/details").param("requestingUserId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.group.name").value("Details Group"));
    }

    @Test
    @WithMockUser
    void getGroupByInviteCode_ReturnsGroup() throws Exception {
        StudyGroupDTO group = StudyGroupDTO.builder().id(1L).name("Invited Group").build();
        given(groupService.getGroupByInviteCode("ABCDEF")).willReturn(group);

        mockMvc.perform(get("/api/groups/invite/ABCDEF"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Invited Group"));
    }

    @Test
    @WithMockUser
    void getUserGroups_ReturnsGroups() throws Exception {
        StudyGroupDTO group = StudyGroupDTO.builder().id(1L).name("User Group").build();
        given(groupService.getUserGroups(10L)).willReturn(Collections.singletonList(group));

        mockMvc.perform(get("/api/groups/user/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("User Group"));
    }

    @Test
    @WithMockUser
    void getCreatedGroups_ReturnsGroups() throws Exception {
        StudyGroupDTO group = StudyGroupDTO.builder().id(1L).name("Created Group").build();
        given(groupService.getCreatedGroups(10L)).willReturn(Collections.singletonList(group));

        mockMvc.perform(get("/api/groups/creator/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Created Group"));
    }

    @Test
    @WithMockUser
    void getGroupLeaderboard_ReturnsLeaderboard() throws Exception {
        com.studyspace.dto.GroupStatsDTO stats = com.studyspace.dto.GroupStatsDTO.builder().groupId(1L).groupName("Leader").build();
        given(groupService.getGroupLeaderboard()).willReturn(Collections.singletonList(stats));

        mockMvc.perform(get("/api/groups/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].groupName").value("Leader"));
    }

    @Test
    @WithMockUser
    void getGroupStats_ReturnsStats() throws Exception {
        com.studyspace.dto.GroupStatsDTO stats = com.studyspace.dto.GroupStatsDTO.builder().groupId(1L).groupName("Stats").build();
        given(groupService.getGroupStats(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyInt())).willReturn(stats);

        mockMvc.perform(get("/api/groups/1/stats").param("minimumMinutes", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupName").value("Stats"));
    }

    @Test
    @WithMockUser
    void getGroupMemberLeaderboard_ReturnsLeaderboard() throws Exception {
        com.studyspace.dto.GroupMemberStatsDTO memberStats = com.studyspace.dto.GroupMemberStatsDTO.builder().userId(1L).fullName("topUser").build();
        given(groupService.getGroupMemberLeaderboard(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyInt())).willReturn(Collections.singletonList(memberStats));

        mockMvc.perform(get("/api/groups/1/members/leaderboard").param("minMinutes", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("topUser"));
    }
}
