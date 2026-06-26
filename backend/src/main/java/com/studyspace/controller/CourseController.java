package com.studyspace.controller;

import com.studyspace.dto.*;
import com.studyspace.service.CourseService;
import com.studyspace.types.EnrollmentStatus;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import java.util.List;

/**
 * REST controller for the Course Administration Module (Feature F1).
 *
 * <p>Handles course creation, section management, material uploads, and student enrollments.
 */
@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000")
public class CourseController {

/**
 * Constructor.
     * @param courseService the courseService
 */
@org.springframework.beans.factory.annotation.Autowired
public CourseController(CourseService courseService) {
        this.courseService = courseService;
}

    private final CourseService courseService;

    // ─── Course Endpoints ──────────────────────────────────────────────────────

    @PostMapping
    /**
     * Creates a new course under the specified instructor.
     *
     * @param instructorId the ID of the instructor creating the course
     * @param request the request body containing course details (title, description, etc.)
     * @return a ResponseEntity containing the created CourseDTO with status 201 (Created)
     */
    public ResponseEntity<CourseDTO> createCourse(
            @RequestParam Long instructorId,
            @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(instructorId, request));
    }

    @PutMapping("/{id}")
    /**
     * Updates an existing course's details.
     *
     * @param id the ID of the course to update
     * @param userId the ID of the user requesting the update (must be the instructor)
     * @param request the request body containing the updated course details
     * @return a ResponseEntity containing the updated CourseDTO
     */
    public ResponseEntity<CourseDTO> updateCourse(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, userId, request));
    }

    @PatchMapping("/{id}/publish")
    /**
     * Toggles the publication status of a course.
     *
     * @param id the ID of the course
     * @param userId the ID of the user requesting the toggle (must be the instructor)
     * @return a ResponseEntity containing the updated CourseDTO
     */
    public ResponseEntity<CourseDTO> togglePublish(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(courseService.togglePublish(id, userId));
    }

    @DeleteMapping("/{id}")
    /**
     * Deletes a course.
     *
     * @param id the ID of the course to delete
     * @param userId the ID of the user requesting deletion (must be the instructor)
     * @return a ResponseEntity with status 204 (No Content)
     */
    public ResponseEntity<Void> deleteCourse(
            @PathVariable Long id,
            @RequestParam Long userId) {
        courseService.deleteCourse(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    /**
     * Retrieves a paginated list of all published courses.
     *
     * @param search an optional search term to filter courses by title or description
     * @param page the page number to retrieve (0-indexed)
     * @param size the number of items per page
     * @return a ResponseEntity containing a page of CourseSummaryDTOs
     */
    public ResponseEntity<Page<CourseSummaryDTO>> getAllPublishedCourses(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getAllPublishedCourses(search, PageRequest.of(page, size)));
    }

    @GetMapping("/my")
    /**
     * Retrieves a paginated list of courses belonging to a specific user (instructor).
     *
     * @param userId the ID of the instructor
     * @param search an optional search term to filter courses
     * @param page the page number to retrieve (0-indexed)
     * @param size the number of items per page
     * @return a ResponseEntity containing a page of CourseSummaryDTOs
     */
    public ResponseEntity<Page<CourseSummaryDTO>> getMyCourses(
            @RequestParam Long userId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getMyCourses(userId, search, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    /**
     * Retrieves detailed information about a specific course.
     *
     * @param id the ID of the course
     * @return a ResponseEntity containing the CourseDTO
     */
    public ResponseEntity<CourseDTO> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    // ─── Section Endpoints ──────────────────────────────────────────────────────

    @PostMapping("/{id}/sections")
    /**
     * Adds a new section to an existing course.
     *
     * @param id the ID of the course
     * @param userId the ID of the user making the request (must be the instructor)
     * @param request the request body containing section details
     * @return a ResponseEntity containing the created CourseSectionDTO with status 201 (Created)
     */
    public ResponseEntity<CourseSectionDTO> addSection(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateSectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.addSection(id, userId, request));
    }

    @PutMapping("/sections/{sectionId}")
    /**
     * Updates an existing course section.
     *
     * @param sectionId the ID of the section to update
     * @param userId the ID of the user making the request (must be the instructor)
     * @param request the request body containing the updated section details
     * @return a ResponseEntity containing the updated CourseSectionDTO
     */
    public ResponseEntity<CourseSectionDTO> updateSection(
            @PathVariable Long sectionId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateSectionRequest request) {
        return ResponseEntity.ok(courseService.updateSection(sectionId, userId, request));
    }

    @DeleteMapping("/sections/{sectionId}")
    /**
     * Deletes a course section.
     *
     * @param sectionId the ID of the section to delete
     * @param userId the ID of the user requesting deletion (must be the instructor)
     * @return a ResponseEntity with status 204 (No Content)
     */
    public ResponseEntity<Void> deleteSection(
            @PathVariable Long sectionId,
            @RequestParam Long userId) {
        courseService.deleteSection(sectionId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Material Endpoints ─────────────────────────────────────────────────────

    @PostMapping(value = "/sections/{sectionId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    /**
     * Uploads a new material file to a specific course section.
     *
     * @param sectionId the ID of the section to upload the material to
     * @param userId the ID of the user making the request (must be the instructor)
     * @param title the title of the material
     * @param file the multipart file being uploaded
     * @return a ResponseEntity containing the created CourseMaterialDTO with status 201 (Created)
     */
    public ResponseEntity<CourseMaterialDTO> uploadMaterial(
            @PathVariable Long sectionId,
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.uploadMaterial(sectionId, userId, file, title));
    }

    @DeleteMapping("/materials/{materialId}")
    /**
     * Deletes a specific course material.
     *
     * @param materialId the ID of the material to delete
     * @param userId the ID of the user requesting deletion (must be the instructor)
     * @return a ResponseEntity with status 204 (No Content)
     */
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long materialId,
            @RequestParam Long userId) {
        courseService.deleteMaterial(materialId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Enrollment Endpoints ───────────────────────────────────────────────────

    @PostMapping("/{id}/enroll")
    /**
     * Enrolls a student in a specific course.
     *
     * @param id the ID of the course to enroll in
     * @param studentId the ID of the student being enrolled
     * @return a ResponseEntity containing the new CourseEnrollmentDTO with status 201 (Created)
     */
    public ResponseEntity<CourseEnrollmentDTO> enrollStudent(
            @PathVariable Long id,
            @RequestParam Long studentId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.enrollStudent(id, studentId));
    }

    @DeleteMapping("/{id}/enroll")
    /**
     * Removes a student's enrollment from a course.
     *
     * @param id the ID of the course
     * @param studentId the ID of the student being unenrolled
     * @return a ResponseEntity with status 204 (No Content)
     */
    public ResponseEntity<Void> unenroll(
            @PathVariable Long id,
            @RequestParam Long studentId) {
        courseService.unenroll(id, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/enrollments")
    /**
     * Retrieves all enrollments for a specific course.
     *
     * @param id the ID of the course
     * @param userId the ID of the user requesting the list (must be the instructor)
     * @return a ResponseEntity containing a list of CourseEnrollmentDTOs
     */
    public ResponseEntity<List<CourseEnrollmentDTO>> getEnrollments(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(courseService.getEnrollments(id, userId));
    }

    @PatchMapping("/enrollments/{enrollmentId}")
    /**
     * Updates the status of an existing enrollment.
     *
     * @param enrollmentId the ID of the enrollment to update
     * @param userId the ID of the user making the request (must be the instructor)
     * @param status the new enrollment status
     * @return a ResponseEntity containing the updated CourseEnrollmentDTO
     */
    public ResponseEntity<CourseEnrollmentDTO> updateEnrollmentStatus(
            @PathVariable Long enrollmentId,
            @RequestParam Long userId,
            @RequestParam EnrollmentStatus status) {
        return ResponseEntity.ok(courseService.updateEnrollmentStatus(enrollmentId, userId, status));
    }

    @GetMapping("/my-enrollments")
    /**
     * Retrieves a paginated list of enrollments for a specific student.
     *
     * @param studentId the ID of the student
     * @param search an optional search term to filter enrollments
     * @param page the page number to retrieve (0-indexed)
     * @param size the number of items per page
     * @return a ResponseEntity containing a page of CourseEnrollmentDTOs
     */
    public ResponseEntity<Page<CourseEnrollmentDTO>> getMyEnrollments(
            @RequestParam Long studentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getMyEnrollments(studentId, search, PageRequest.of(page, size)));
    }
}
