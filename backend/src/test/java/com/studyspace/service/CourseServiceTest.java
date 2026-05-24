package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.EnrollmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CourseSectionRepository sectionRepository;
    @Mock private CourseMaterialRepository materialRepository;
    @Mock private CourseEnrollmentRepository enrollmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private CourseService courseService;

    private User instructor;
    private User student;
    private Course course;

    @BeforeEach
    void setUp() {
        instructor = User.builder().id(1L).fullName("Prof Smith").email("prof@example.com").build();
        student = User.builder().id(2L).fullName("Jane Student").email("jane@example.com").build();
        course = Course.builder()
                .id(10L)
                .title("Data Structures")
                .description("A course on DS")
                .instructor(instructor)
                .isPublished(false)
                .sections(new ArrayList<>())
                .enrollments(new ArrayList<>())
                .build();
    }

    // ─── createCourse ───────────────────────────────────────────────────────────

    @Test
    void createCourse_Success() {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("Data Structures");
        request.setDescription("A course on DS");
        request.setIsPublished(false);

        when(userRepository.findById(1L)).thenReturn(Optional.of(instructor));
        when(courseRepository.save(any(Course.class))).thenReturn(course);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        CourseDTO result = courseService.createCourse(1L, request);

        assertNotNull(result);
        assertEquals("Data Structures", result.getTitle());
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    void createCourse_InstructorNotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> courseService.createCourse(99L, new CreateCourseRequest()));
    }

    // ─── updateCourse ───────────────────────────────────────────────────────────

    @Test
    void getCourseById_Success() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        CourseDTO result = courseService.getCourseById(10L);

        assertNotNull(result);
        assertEquals("Data Structures", result.getTitle());
    }

    @Test
    void getMyCourses_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(instructor));
        when(courseRepository.findByInstructor(instructor)).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        List<CourseSummaryDTO> result = courseService.getMyCourses(1L);

        assertEquals(1, result.size());
        assertEquals("Data Structures", result.get(0).getTitle());
    }

    // ─── updateCourse ───────────────────────────────────────────────────────────

    @Test
    void updateCourse_Success() {
        CreateCourseRequest request = new CreateCourseRequest();
        request.setTitle("Updated Title");
        request.setDescription("Updated desc");

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenReturn(course);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        CourseDTO result = courseService.updateCourse(10L, 1L, request);

        assertNotNull(result);
        verify(courseRepository).save(course);
    }

    @Test
    void updateCourse_ForbiddenForNonInstructor_ThrowsException() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThrows(RuntimeException.class,
                () -> courseService.updateCourse(10L, 999L, new CreateCourseRequest()));
    }

    // ─── togglePublish ───────────────────────────────────────────────────────────

    @Test
    void togglePublish_PublishesUnpublishedCourse() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenReturn(course);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        courseService.togglePublish(10L, 1L);

        assertTrue(course.getIsPublished());
    }

    @Test
    void togglePublish_UnpublishesPublishedCourse() {
        course.setIsPublished(true);

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenReturn(course);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        courseService.togglePublish(10L, 1L);

        assertFalse(course.getIsPublished());
    }

    // ─── deleteCourse ───────────────────────────────────────────────────────────

    @Test
    void deleteCourse_Success() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        courseService.deleteCourse(10L, 1L);

        verify(courseRepository).delete(course);
    }

    @Test
    void deleteCourse_ForbiddenForNonInstructor_ThrowsException() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThrows(RuntimeException.class, () -> courseService.deleteCourse(10L, 999L));
        verify(courseRepository, never()).delete(any());
    }

    // ─── addSection ─────────────────────────────────────────────────────────────

    @Test
    void addSection_Success() {
        CreateSectionRequest request = new CreateSectionRequest();
        request.setTitle("Week 1");

        CourseSection section = CourseSection.builder()
                .id(20L)
                .title("Week 1")
                .course(course)
                .orderIndex(0)
                .materials(new ArrayList<>())
                .build();

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(sectionRepository.save(any(CourseSection.class))).thenReturn(section);

        CourseSectionDTO result = courseService.addSection(10L, 1L, request);

        assertNotNull(result);
        assertEquals("Week 1", result.getTitle());
    }

    @Test
    void addSection_ForbiddenForNonInstructor_ThrowsException() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThrows(RuntimeException.class,
                () -> courseService.addSection(10L, 999L, new CreateSectionRequest()));
    }

    // ─── enrollStudent ───────────────────────────────────────────────────────────

    @Test
    void deleteSection_Success() {
        CourseSection section = CourseSection.builder()
                .id(20L)
                .course(course)
                .build();
        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));

        courseService.deleteSection(20L, 1L);

        verify(sectionRepository).delete(section);
    }

    @Test
    void deleteSection_Forbidden_ThrowsException() {
        CourseSection section = CourseSection.builder()
                .id(20L)
                .course(course)
                .build();
        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));

        assertThrows(RuntimeException.class, () -> courseService.deleteSection(20L, 999L));
    }

    // ─── enrollStudent ───────────────────────────────────────────────────────────

    @Test
    void enrollStudent_NewEnrollment_Success() {
        CourseEnrollment enrollment = CourseEnrollment.builder()
                .id(30L)
                .course(course)
                .student(student)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.existsByCourseIdAndStudentId(10L, 2L)).thenReturn(false);
        when(enrollmentRepository.save(any(CourseEnrollment.class))).thenReturn(enrollment);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(1L);

        CourseEnrollmentDTO result = courseService.enrollStudent(10L, 2L);

        assertNotNull(result);
        assertEquals(EnrollmentStatus.ACTIVE, result.getStatus());
    }

    @Test
    void enrollStudent_ReActivatesDroppedEnrollment() {
        CourseEnrollment droppedEnrollment = CourseEnrollment.builder()
                .id(31L)
                .course(course)
                .student(student)
                .status(EnrollmentStatus.DROPPED)
                .build();

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.existsByCourseIdAndStudentId(10L, 2L)).thenReturn(true);
        when(enrollmentRepository.findByCourseIdAndStudentId(10L, 2L))
                .thenReturn(Optional.of(droppedEnrollment));
        when(enrollmentRepository.save(any(CourseEnrollment.class))).thenReturn(droppedEnrollment);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(1L);

        CourseEnrollmentDTO result = courseService.enrollStudent(10L, 2L);

        assertNotNull(result);
        assertEquals(EnrollmentStatus.ACTIVE, droppedEnrollment.getStatus());
    }

    // ─── unenroll ───────────────────────────────────────────────────────────────

    @Test
    void updateEnrollmentStatus_Success() {
        CourseEnrollment enrollment = CourseEnrollment.builder()
                .id(30L)
                .course(course)
                .student(student)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        when(enrollmentRepository.findById(30L)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(CourseEnrollment.class))).thenReturn(enrollment);
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(1L);

        CourseEnrollmentDTO result = courseService.updateEnrollmentStatus(30L, 1L, EnrollmentStatus.DROPPED);

        assertNotNull(result);
        assertEquals(EnrollmentStatus.DROPPED, result.getStatus());
    }

    @Test
    void getEnrollments_Success() {
        CourseEnrollment enrollment = CourseEnrollment.builder()
                .id(30L)
                .course(course)
                .student(student)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.findByCourseId(10L)).thenReturn(List.of(enrollment));
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(1L);

        List<CourseEnrollmentDTO> result = courseService.getEnrollments(10L, 1L);

        assertEquals(1, result.size());
        assertEquals(EnrollmentStatus.ACTIVE, result.get(0).getStatus());
    }

    // ─── unenroll ───────────────────────────────────────────────────────────────

    @Test
    void unenroll_SetsStatusToDropped() {
        CourseEnrollment enrollment = CourseEnrollment.builder()
                .id(30L)
                .course(course)
                .student(student)
                .status(EnrollmentStatus.ACTIVE)
                .build();

        when(enrollmentRepository.findByCourseIdAndStudentId(10L, 2L))
                .thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(CourseEnrollment.class))).thenReturn(enrollment);

        courseService.unenroll(10L, 2L);

        assertEquals(EnrollmentStatus.DROPPED, enrollment.getStatus());
    }

    @Test
    void unenroll_NotEnrolled_ThrowsException() {
        when(enrollmentRepository.findByCourseIdAndStudentId(10L, 99L))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> courseService.unenroll(10L, 99L));
    }

    // ─── getMyEnrollments ───────────────────────────────────────────────────────

    @Test
    void getMyEnrollments_FiltersUnpublishedCourses() {
        Course unpublished = Course.builder().id(20L).title("Hidden").isPublished(false)
                .instructor(instructor).sections(new ArrayList<>()).enrollments(new ArrayList<>()).build();
        CourseEnrollment e = CourseEnrollment.builder()
                .id(40L).course(unpublished).student(student).status(EnrollmentStatus.ACTIVE).build();

        when(enrollmentRepository.findByStudentId(2L)).thenReturn(List.of(e));

        List<CourseEnrollmentDTO> result = courseService.getMyEnrollments(2L);

        // Unpublished course should be filtered out
        assertTrue(result.isEmpty());
    }

    // ─── getAllPublishedCourses ───────────────────────────────────────────────────

    @Test
    void getAllPublishedCourses_ReturnsList() {
        course.setIsPublished(true);
        when(courseRepository.findByIsPublishedTrue()).thenReturn(List.of(course));
        when(enrollmentRepository.countByCourseIdAndStatus(10L, EnrollmentStatus.ACTIVE)).thenReturn(0L);

        List<CourseSummaryDTO> result = courseService.getAllPublishedCourses();

        assertEquals(1, result.size());
        assertEquals("Data Structures", result.get(0).getTitle());
    }

    // ─── updateSection ──────────────────────────────────────────────────────────

    @Test
    void updateSection_Success() {
        CourseSection section = CourseSection.builder().id(20L).title("Old Title").course(course).build();
        CreateSectionRequest request = new CreateSectionRequest();
        request.setTitle("New Title");
        request.setDescription("New Desc");
        request.setOrderIndex(1);

        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(sectionRepository.save(any(CourseSection.class))).thenReturn(section);

        CourseSectionDTO result = courseService.updateSection(20L, 1L, request);

        assertNotNull(result);
        assertEquals("New Title", section.getTitle());
        assertEquals("New Desc", section.getDescription());
        assertEquals(1, section.getOrderIndex());
    }

    @Test
    void updateSection_Forbidden_ThrowsException() {
        CourseSection section = CourseSection.builder().id(20L).title("Old Title").course(course).build();
        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));
        assertThrows(RuntimeException.class, () -> courseService.updateSection(20L, 2L, new CreateSectionRequest()));
    }

    // ─── uploadMaterial (detectFileType) ────────────────────────────────────────

    @Test
    void uploadMaterial_DetectsAllFileTypes() {
        CourseSection section = CourseSection.builder().id(20L).title("S1").course(course).build();
        when(sectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(fileStorageService.store(any(), anyString())).thenReturn("url");
        when(materialRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);

        // PDF
        when(mockFile.getOriginalFilename()).thenReturn("test.pdf");
        CourseMaterialDTO dto = courseService.uploadMaterial(20L, 1L, mockFile, "Title");
        assertEquals(com.studyspace.types.MaterialType.PDF, dto.getFileType());

        // SLIDES
        when(mockFile.getOriginalFilename()).thenReturn("test.ppt");
        dto = courseService.uploadMaterial(20L, 1L, mockFile, "Title");
        assertEquals(com.studyspace.types.MaterialType.SLIDES, dto.getFileType());

        // VIDEO
        when(mockFile.getOriginalFilename()).thenReturn("test.mp4");
        dto = courseService.uploadMaterial(20L, 1L, mockFile, "Title");
        assertEquals(com.studyspace.types.MaterialType.VIDEO, dto.getFileType());

        // IMAGE
        when(mockFile.getOriginalFilename()).thenReturn("test.jpg");
        dto = courseService.uploadMaterial(20L, 1L, mockFile, "Title");
        assertEquals(com.studyspace.types.MaterialType.IMAGE, dto.getFileType());

        // Null filename
        when(mockFile.getOriginalFilename()).thenReturn(null);
        dto = courseService.uploadMaterial(20L, 1L, mockFile, "Title");
        assertEquals(com.studyspace.types.MaterialType.OTHER, dto.getFileType());
    }

    @Test
    void deleteMaterial_Success() {
        CourseSection section = CourseSection.builder().id(20L).course(course).build();
        CourseMaterial material = CourseMaterial.builder().id(50L).fileUrl("url").section(section).build();

        when(materialRepository.findById(50L)).thenReturn(Optional.of(material));

        courseService.deleteMaterial(50L, 1L);

        verify(fileStorageService).delete("url");
        verify(materialRepository).delete(material);
    }
}
