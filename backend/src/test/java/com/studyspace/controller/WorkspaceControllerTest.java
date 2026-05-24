package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.CreateSpaceRequest;
import com.studyspace.dto.CreateWorkspaceRequest;
import com.studyspace.dto.StudentWorkspaceDTO;
import com.studyspace.dto.WorkspaceSpaceDTO;
import com.studyspace.security.JwtAuthenticationFilter;
import com.studyspace.service.WorkspaceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = WorkspaceController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
class WorkspaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WorkspaceService workspaceService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void createWorkspace() throws Exception {
        CreateWorkspaceRequest req = new CreateWorkspaceRequest();
        req.setName("My Workspace");

        StudentWorkspaceDTO dto = StudentWorkspaceDTO.builder().id(1L).name("My Workspace").build();

        when(workspaceService.createWorkspace(eq(1L), any(CreateWorkspaceRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/workspaces")
                .param("userId", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser
    void getMyWorkspaces() throws Exception {
        StudentWorkspaceDTO dto = StudentWorkspaceDTO.builder().id(1L).build();

        when(workspaceService.getMyWorkspaces(1L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/workspaces/my")
                .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    @WithMockUser
    void getPublicWorkspaces() throws Exception {
        StudentWorkspaceDTO dto = StudentWorkspaceDTO.builder().id(1L).build();

        when(workspaceService.getPublicWorkspaces(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/workspaces/public")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @WithMockUser
    void getWorkspace() throws Exception {
        StudentWorkspaceDTO dto = StudentWorkspaceDTO.builder().id(1L).build();

        when(workspaceService.getWorkspaceById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/workspaces/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser
    void updateWorkspace() throws Exception {
        CreateWorkspaceRequest req = new CreateWorkspaceRequest();
        req.setName("Updated");

        StudentWorkspaceDTO dto = StudentWorkspaceDTO.builder().id(1L).name("Updated").build();

        when(workspaceService.updateWorkspace(eq(1L), eq(1L), any(CreateWorkspaceRequest.class))).thenReturn(dto);

        mockMvc.perform(put("/api/workspaces/1")
                .param("userId", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
    }

    @Test
    @WithMockUser
    void deleteWorkspace() throws Exception {
        mockMvc.perform(delete("/api/workspaces/1")
                .param("userId", "1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void createSpace() throws Exception {
        CreateSpaceRequest req = new CreateSpaceRequest();
        req.setTitle("Space");

        WorkspaceSpaceDTO dto = WorkspaceSpaceDTO.builder().id(10L).build();

        when(workspaceService.createSpace(eq(1L), eq(1L), any(CreateSpaceRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/workspaces/1/spaces")
                .param("userId", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10));
    }
}
