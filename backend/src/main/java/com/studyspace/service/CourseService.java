package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.EnrollmentStatus;
import com.studyspace.types.MaterialType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseSectionRepository sectionRepository;
    private final CourseMaterialRepository materialRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    // ─── Course CRUD ────────────────────────────────────────────────────────────

    public CourseDTO createCourse(Long instructorId, CreateCourseRequest request) {
        User instructor = findUser(instructorId);
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .instructor(instructor)
                .isPublished(Boolean.TRUE.equals(request.getIsPublished()))
                .build();
        return toDTO(courseRepository.save(course));
    }

    public CourseDTO updateCourse(Long courseId, Long requestingUserId, CreateCourseRequest request) {
        Course course = findCourse(courseId);
        assertInstructor(course, requestingUserId);
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        if (request.getIsPublished() != null) {
            course.setIsPublished(request.getIsPublished());
        }
        return toDTO(courseRepository.save(course));
    }

    public CourseDTO togglePublish(Long courseId, Long requestingUserId) {
        Course course = findCourse(courseId);
        assertInstructor(course, requestingUserId);
        course.setIsPublished(!course.getIsPublished());
        return toDTO(courseRepository.save(course));
    }

    public void deleteCourse(Long courseId, Long requestingUserId) {
        Course course = findCourse(courseId);
        assertInstructor(course, requestingUserId);
        courseRepository.delete(course);
    }

    @Transactional(readOnly = true)
    public CourseDTO getCourseById(Long courseId) {
        return toDTO(findCourse(courseId));
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDTO> getAllPublishedCourses() {
        return courseRepository.findByIsPublishedTrue()
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDTO> getMyCourses(Long instructorId) {
        User instructor = findUser(instructorId);
        return courseRepository.findByInstructor(instructor)
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    // ─── Section CRUD ───────────────────────────────────────────────────────────

    public CourseSectionDTO addSection(Long courseId, Long requestingUserId, CreateSectionRequest request) {
        Course course = findCourse(courseId);
        assertInstructor(course, requestingUserId);
        CourseSection section = CourseSection.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : course.getSections().size())
                .course(course)
                .build();
        return toSectionDTO(sectionRepository.save(section));
    }

    public CourseSectionDTO updateSection(Long sectionId, Long requestingUserId, CreateSectionRequest request) {
        CourseSection section = findSection(sectionId);
        assertInstructor(section.getCourse(), requestingUserId);
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        if (request.getOrderIndex() != null) {
            section.setOrderIndex(request.getOrderIndex());
        }
        return toSectionDTO(sectionRepository.save(section));
    }

    public void deleteSection(Long sectionId, Long requestingUserId) {
        CourseSection section = findSection(sectionId);
        assertInstructor(section.getCourse(), requestingUserId);
        sectionRepository.delete(section);
    }

    // ─── Material Upload ─────────────────────────────────────────────────────────

    public CourseMaterialDTO uploadMaterial(Long sectionId, Long requestingUserId,
                                             MultipartFile file, String title) {
        CourseSection section = findSection(sectionId);
        assertInstructor(section.getCourse(), requestingUserId);

        String fileUrl = fileStorageService.store(file, "courses");
        MaterialType fileType = detectFileType(file.getOriginalFilename(), file.getContentType());

        CourseMaterial material = CourseMaterial.builder()
                .title(title)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .originalFileName(file.getOriginalFilename())
                .section(section)
                .build();
        return toMaterialDTO(materialRepository.save(material));
    }

    public void deleteMaterial(Long materialId, Long requestingUserId) {
        CourseMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found: " + materialId));
        assertInstructor(material.getSection().getCourse(), requestingUserId);
        fileStorageService.delete(material.getFileUrl());
        materialRepository.delete(material);
    }

    // ─── Enrollment ──────────────────────────────────────────────────────────────

    public CourseEnrollmentDTO enrollStudent(Long courseId, Long studentId) {
        Course course = findCourse(courseId);
        User student = findUser(studentId);

        if (enrollmentRepository.existsByCourseIdAndStudentId(courseId, studentId)) {
            // Re-activate if previously dropped
            CourseEnrollment existing = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId).get();
            existing.setStatus(EnrollmentStatus.ACTIVE);
            return toEnrollmentDTO(enrollmentRepository.save(existing));
        }

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .course(course)
                .student(student)
                .status(EnrollmentStatus.ACTIVE)
                .build();
        return toEnrollmentDTO(enrollmentRepository.save(enrollment));
    }

    public CourseEnrollmentDTO updateEnrollmentStatus(Long enrollmentId, Long requestingUserId, EnrollmentStatus status) {
        CourseEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found: " + enrollmentId));
        assertInstructor(enrollment.getCourse(), requestingUserId);
        enrollment.setStatus(status);
        return toEnrollmentDTO(enrollmentRepository.save(enrollment));
    }

    public void unenroll(Long courseId, Long studentId) {
        CourseEnrollment enrollment = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);
    }

    @Transactional(readOnly = true)
    public List<CourseEnrollmentDTO> getEnrollments(Long courseId, Long requestingUserId) {
        Course course = findCourse(courseId);
        assertInstructor(course, requestingUserId);
        return enrollmentRepository.findByCourseId(courseId)
                .stream().map(this::toEnrollmentDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseEnrollmentDTO> getMyEnrollments(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId)
                .stream()
                .filter(e -> Boolean.TRUE.equals(e.getCourse().getIsPublished()))
                .map(this::toEnrollmentDTO)
                .collect(Collectors.toList());
    }

    // ─── Helpers & Mappers ───────────────────────────────────────────────────────

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
    }

    private CourseSection findSection(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Section not found: " + id));
    }

    private void assertInstructor(Course course, Long userId) {
        if (!course.getInstructor().getId().equals(userId)) {
            throw new RuntimeException("Forbidden: only the instructor can modify this course.");
        }
    }

    private MaterialType detectFileType(String filename, String contentType) {
        if (filename == null) return MaterialType.OTHER;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return MaterialType.PDF;
        if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return MaterialType.SLIDES;
        if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi")) return MaterialType.VIDEO;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return MaterialType.IMAGE;
        return MaterialType.OTHER;
    }

    private CourseDTO toDTO(Course course) {
        return CourseDTO.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .instructorId(course.getInstructor().getId())
                .instructorName(course.getInstructor().getFullName())
                .isPublished(course.getIsPublished())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .sections(course.getSections().stream().map(this::toSectionDTO).collect(Collectors.toList()))
                .enrollmentCount(enrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.ACTIVE))
                .build();
    }

    private CourseSummaryDTO toSummaryDTO(Course course) {
        return CourseSummaryDTO.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .instructorId(course.getInstructor().getId())
                .instructorName(course.getInstructor().getFullName())
                .isPublished(course.getIsPublished())
                .createdAt(course.getCreatedAt())
                .enrollmentCount(enrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.ACTIVE))
                .sectionCount(course.getSections().size())
                .build();
    }

    private CourseSectionDTO toSectionDTO(CourseSection section) {
        return CourseSectionDTO.builder()
                .id(section.getId())
                .title(section.getTitle())
                .description(section.getDescription())
                .orderIndex(section.getOrderIndex())
                .createdAt(section.getCreatedAt())
                .materials(section.getMaterials().stream().map(this::toMaterialDTO).collect(Collectors.toList()))
                .build();
    }

    private CourseMaterialDTO toMaterialDTO(CourseMaterial material) {
        return CourseMaterialDTO.builder()
                .id(material.getId())
                .title(material.getTitle())
                .fileUrl(material.getFileUrl())
                .fileType(material.getFileType())
                .originalFileName(material.getOriginalFileName())
                .uploadedAt(material.getUploadedAt())
                .build();
    }

    private CourseEnrollmentDTO toEnrollmentDTO(CourseEnrollment enrollment) {
        return CourseEnrollmentDTO.builder()
                .id(enrollment.getId())
                .courseId(enrollment.getCourse().getId())
                .courseTitle(enrollment.getCourse().getTitle())
                .studentId(enrollment.getStudent().getId())
                .studentName(enrollment.getStudent().getFullName())
                .studentEmail(enrollment.getStudent().getEmail())
                .status(enrollment.getStatus())
                .enrolledAt(enrollment.getEnrolledAt())
                .enrollmentCount((int) enrollmentRepository.countByCourseIdAndStatus(enrollment.getCourse().getId(), EnrollmentStatus.ACTIVE))
                .sectionCount(enrollment.getCourse().getSections().size())
                .build();
    }
}
