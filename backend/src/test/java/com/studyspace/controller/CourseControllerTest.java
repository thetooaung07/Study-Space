package com.studyspace.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyspace.dto.*;
import com.studyspace.service.CourseService;
import com.studyspace.types.EnrollmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.studyspace.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

/**
 * Standalone MockMvc unit tests for CourseController.
 * Exercises HTTP status codes and JSON response shape without loading Spring context.
 */
@WebMvcTest(
    controllers = CourseController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
class CourseControllerTest {

    @MockitoBean
    private CourseService courseService;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
    }

    // ─── POST /api/courses ────────────────────────────────────────────────────────

    @Test
    void createCourse_Returns201WithBody() throws Exception {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("Algorithms");

        CourseDTO dto = CourseDTO.builder()
                .id(1L).title("Algorithms").instructorId(10L).isPublished(false).build();

        when(courseService.createCourse(eq(10L), any(CreateCourseRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/courses")
                        .param("instructorId", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Algorithms"));
    }

    @Test
    void createCourse_MissingTitle_Returns400() throws Exception {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle(""); // blank title

        mockMvc.perform(post("/api/courses")
                        .param("instructorId", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors").isArray());
    }


    @Test
    void createCourse_ServiceThrowsException_Returns4xx() throws Exception {
        when(courseService.createCourse(anyLong(), any(CreateCourseRequest.class)))
                .thenThrow(new RuntimeException("Instructor not found"));

        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("Bad Course");

        mockMvc.perform(post("/api/courses")
                        .param("instructorId", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    // ─── GET /api/courses ─────────────────────────────────────────────────────────

    @Test
    void getAllPublishedCourses_Returns200WithList() throws Exception {
        CourseSummaryDTO summary = CourseSummaryDTO.builder()
                .id(1L).title("Algorithms").isPublished(true).build();

        when(courseService.getAllPublishedCourses(any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(summary)));

        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Algorithms"));
    }

    // ─── GET /api/courses/{id} ────────────────────────────────────────────────────

    @Test
    void getCourse_ById_Returns200() throws Exception {
        CourseDTO dto = CourseDTO.builder().id(5L).title("OS").instructorId(1L).isPublished(true).build();

        when(courseService.getCourseById(5L)).thenReturn(dto);

        mockMvc.perform(get("/api/courses/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("OS"));
    }

    @Test
    void getCourse_NotFound_Returns4xx() throws Exception {
        when(courseService.getCourseById(999L))
                .thenThrow(new RuntimeException("Course not found: 999"));

        mockMvc.perform(get("/api/courses/999"))
                .andExpect(status().is4xxClientError());
    }

    // ─── DELETE /api/courses/{id} ─────────────────────────────────────────────────

    @Test
    void deleteCourse_Returns204() throws Exception {
        doNothing().when(courseService).deleteCourse(1L, 10L);

        mockMvc.perform(delete("/api/courses/1").param("userId", "10"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCourse_ForbiddenUser_Returns4xx() throws Exception {
        doThrow(new RuntimeException("Forbidden: only the instructor can modify this course."))
                .when(courseService).deleteCourse(1L, 99L);

        mockMvc.perform(delete("/api/courses/1").param("userId", "99"))
                .andExpect(status().is4xxClientError());
    }

    // ─── POST /api/courses/{id}/enroll ────────────────────────────────────────────

    @Test
    void enrollStudent_Returns201() throws Exception {
        CourseEnrollmentDTO enrollment = CourseEnrollmentDTO.builder()
                .id(100L)
                .courseId(1L)
                .studentId(2L)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        when(courseService.enrollStudent(1L, 2L)).thenReturn(enrollment);

        mockMvc.perform(post("/api/courses/1/enroll").param("studentId", "2"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    // ─── DELETE /api/courses/{id}/enroll ─────────────────────────────────────────

    @Test
    void unenroll_Returns204() throws Exception {
        doNothing().when(courseService).unenroll(1L, 2L);

        mockMvc.perform(delete("/api/courses/1/enroll").param("studentId", "2"))
                .andExpect(status().isNoContent());
    }

    // ─── PATCH /api/courses/{id}/publish ─────────────────────────────────────────

    @Test
    void togglePublish_Returns200() throws Exception {
        CourseDTO dto = CourseDTO.builder().id(1L).title("Algorithms").isPublished(true).build();

        when(courseService.togglePublish(1L, 10L)).thenReturn(dto);

        mockMvc.perform(patch("/api/courses/1/publish").param("userId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPublished").value(true));
    }

    // ─── Missing Endpoint Tests ───────────────────────────────────────────────

    @Test
    void updateCourse_Returns200() throws Exception {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("Updated Title");
        
        CourseDTO dto = CourseDTO.builder().id(1L).title("Updated Title").build();
        when(courseService.updateCourse(eq(1L), eq(10L), any(CreateCourseRequest.class))).thenReturn(dto);

        mockMvc.perform(put("/api/courses/1")
                        .param("userId", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    void getMyCourses_Returns200() throws Exception {
        CourseSummaryDTO summary = CourseSummaryDTO.builder().id(1L).title("My Course").build();
        when(courseService.getMyCourses(eq(10L), any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(summary)));

        mockMvc.perform(get("/api/courses/my").param("userId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    void addSection_Returns201() throws Exception {
        CreateSectionRequest request = new CreateSectionRequest();
        request.setTitle("Section 1");

        CourseSectionDTO dto = CourseSectionDTO.builder().id(1L).title("Section 1").build();
        when(courseService.addSection(eq(1L), eq(10L), any(CreateSectionRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/courses/1/sections")
                        .param("userId", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Section 1"));
    }

    @Test
    void updateSection_Returns200() throws Exception {
        CreateSectionRequest request = new CreateSectionRequest();
        request.setTitle("Updated Section");

        CourseSectionDTO dto = CourseSectionDTO.builder().id(2L).title("Updated Section").build();
        when(courseService.updateSection(eq(2L), eq(10L), any(CreateSectionRequest.class))).thenReturn(dto);

        mockMvc.perform(put("/api/courses/sections/2")
                        .param("userId", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Section"));
    }

    @Test
    void deleteSection_Returns204() throws Exception {
        doNothing().when(courseService).deleteSection(2L, 10L);

        mockMvc.perform(delete("/api/courses/sections/2").param("userId", "10"))
                .andExpect(status().isNoContent());
    }

    @Test
    void uploadMaterial_Returns201() throws Exception {
        CourseMaterialDTO dto = CourseMaterialDTO.builder().id(3L).title("Slide 1").build();
        
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile("file", "test.pdf", "application/pdf", "content".getBytes());
        when(courseService.uploadMaterial(eq(2L), eq(10L), any(), eq("Slide 1"))).thenReturn(dto);

        mockMvc.perform(multipart("/api/courses/sections/2/materials")
                        .file(file)
                        .param("userId", "10")
                        .param("title", "Slide 1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Slide 1"));
    }

    @Test
    void deleteMaterial_Returns204() throws Exception {
        doNothing().when(courseService).deleteMaterial(3L, 10L);

        mockMvc.perform(delete("/api/courses/materials/3").param("userId", "10"))
                .andExpect(status().isNoContent());
    }

    @Test
    void getEnrollments_Returns200() throws Exception {
        CourseEnrollmentDTO dto = CourseEnrollmentDTO.builder().id(1L).studentId(2L).status(EnrollmentStatus.ACTIVE).build();
        when(courseService.getEnrollments(1L, 10L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/courses/1/enrollments").param("userId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void updateEnrollmentStatus_Returns200() throws Exception {
        CourseEnrollmentDTO dto = CourseEnrollmentDTO.builder().id(1L).status(EnrollmentStatus.ACTIVE).build();
        when(courseService.updateEnrollmentStatus(1L, 10L, EnrollmentStatus.ACTIVE)).thenReturn(dto);

        mockMvc.perform(patch("/api/courses/enrollments/1")
                        .param("userId", "10")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getMyEnrollments_Returns200() throws Exception {
        CourseEnrollmentDTO dto = CourseEnrollmentDTO.builder().id(1L).status(EnrollmentStatus.ACTIVE).build();
        when(courseService.getMyEnrollments(eq(2L), any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/courses/my-enrollments").param("studentId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }
}
