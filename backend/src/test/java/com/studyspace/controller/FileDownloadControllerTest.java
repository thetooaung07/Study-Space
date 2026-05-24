package com.studyspace.controller;

import com.studyspace.entity.CourseMaterial;
import com.studyspace.repository.CourseMaterialRepository;
import com.studyspace.repository.WorkspaceMaterialRepository;
import com.studyspace.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = FileDownloadController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
class FileDownloadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CourseMaterialRepository courseMaterialRepository;

    @MockitoBean
    private WorkspaceMaterialRepository workspaceMaterialRepository;

    @Test
    @WithMockUser
    void downloadFile_CourseMaterial_FileNotFound() throws Exception {
        CourseMaterial material = new CourseMaterial();
        material.setFileUrl("/uploads/nonexistent.pdf");
        material.setOriginalFileName("test.pdf");

        when(courseMaterialRepository.findById(1L)).thenReturn(Optional.of(material));

        mockMvc.perform(get("/api/files/download")
                .param("materialId", "1")
                .param("type", "COURSE"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void downloadFile_InvalidType() throws Exception {
        mockMvc.perform(get("/api/files/download")
                .param("materialId", "1")
                .param("type", "INVALID"))
                .andExpect(status().isBadRequest()); // Will cause an exception mapping or 400
    }

    @Test
    @WithMockUser
    void downloadFile_CourseMaterial_Success() throws Exception {
        CourseMaterial material = new CourseMaterial();
        material.setFileUrl("/uploads/test.pdf");
        material.setOriginalFileName("test.pdf");

        // create a real file so it exists
        java.io.File uploadDir = new java.io.File("./uploads");
        if (!uploadDir.exists()) uploadDir.mkdirs();
        java.io.File file = new java.io.File(uploadDir, "test.pdf");
        if (!file.exists()) file.createNewFile();

        when(courseMaterialRepository.findById(1L)).thenReturn(Optional.of(material));

        mockMvc.perform(get("/api/files/download")
                .param("materialId", "1")
                .param("type", "COURSE"))
                .andExpect(status().isOk());
        
        file.delete();
    }

    @Test
    @WithMockUser
    void downloadFile_WorkspaceMaterial_Success() throws Exception {
        com.studyspace.entity.WorkspaceMaterial material = new com.studyspace.entity.WorkspaceMaterial();
        material.setFileUrl("/uploads/test2.pdf");
        material.setOriginalFileName("test2.pdf");

        // create a real file so it exists
        java.io.File uploadDir = new java.io.File("./uploads");
        if (!uploadDir.exists()) uploadDir.mkdirs();
        java.io.File file = new java.io.File(uploadDir, "test2.pdf");
        if (!file.exists()) file.createNewFile();

        when(workspaceMaterialRepository.findById(1L)).thenReturn(Optional.of(material));

        mockMvc.perform(get("/api/files/download")
                .param("materialId", "1")
                .param("type", "WORKSPACE"))
                .andExpect(status().isOk());
        
        file.delete();
    }
}
