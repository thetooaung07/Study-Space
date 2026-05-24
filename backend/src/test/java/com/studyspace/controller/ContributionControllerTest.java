package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.ContributionProposalDTO;
import com.studyspace.dto.ReviewProposalRequest;
import com.studyspace.dto.SubmitProposalRequest;
import com.studyspace.security.JwtAuthenticationFilter;
import com.studyspace.service.ContributionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
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
    controllers = ContributionController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
class ContributionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContributionService contributionService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void submitProposals() throws Exception {
        SubmitProposalRequest req = new SubmitProposalRequest();
        req.setTargetCourseId(1L);
        req.setSourceMaterialIds(List.of(1L));

        ContributionProposalDTO dto = ContributionProposalDTO.builder().id(10L).build();

        when(contributionService.submitProposals(eq(1L), any(SubmitProposalRequest.class)))
                .thenReturn(List.of(dto));

        mockMvc.perform(post("/api/contributions")
                .param("studentId", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].id").value(10));
    }

    @Test
    @WithMockUser
    void getMyProposals() throws Exception {
        mockMvc.perform(get("/api/contributions/my")
                .param("studentId", "1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void getProposalsForCourse() throws Exception {
        mockMvc.perform(get("/api/contributions/course/1")
                .param("userId", "1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void reviewProposal() throws Exception {
        ReviewProposalRequest req = new ReviewProposalRequest();
        req.setStatus(com.studyspace.types.ProposalStatus.APPROVED);

        ContributionProposalDTO dto = ContributionProposalDTO.builder().id(10L).build();

        when(contributionService.reviewProposal(eq(10L), eq(1L), any(ReviewProposalRequest.class)))
                .thenReturn(dto);

        mockMvc.perform(patch("/api/contributions/10/review")
                .param("userId", "1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    @WithMockUser
    void getAcceptedContributions() throws Exception {
        mockMvc.perform(get("/api/contributions/course/1/accepted"))
                .andExpect(status().isOk());
    }
}
