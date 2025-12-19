package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.StudyGroupDTO;
import com.studyspace.service.StudyGroupService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

    @MockBean
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
}
