package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.ChatQueryRequest;
import com.studyspace.security.JwtAuthenticationFilter;
import com.studyspace.service.DocumentVectorService;
import com.studyspace.service.MemoryManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = ChatController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentVectorService documentVectorService;

    @MockitoBean
    private MemoryManager memoryManager;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void query_Success() throws Exception {
        ChatQueryRequest req = new ChatQueryRequest();
        req.setQuestion("What is this?");
        req.setConversationId("1");

        when(memoryManager.handleQuery(eq("1"), eq("What is this?"), anyList(), isNull()))
                .thenReturn("This is a test response.");

        mockMvc.perform(post("/api/chat/query")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("This is a test response."));
    }

    @Test
    @WithMockUser
    void query_WithDocumentUrl_Success() throws Exception {
        ChatQueryRequest req = new ChatQueryRequest();
        req.setQuestion("Explain this doc.");
        req.setDocumentUrl("http://example.com/doc.pdf");
        req.setDocumentTitle("Test Doc");

        when(documentVectorService.retrieveRelevantChunks(anyString(), anyInt()))
                .thenReturn(List.of("chunk1", "chunk2"));
        
        when(memoryManager.handleQuery(isNull(), eq("Explain this doc."), eq(List.of("chunk1", "chunk2")), isNull()))
                .thenReturn("Doc explained.");

        mockMvc.perform(post("/api/chat/query")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("Doc explained."))
                .andExpect(jsonPath("$.contextDocumentTitle").value("Test Doc"));
    }
}
