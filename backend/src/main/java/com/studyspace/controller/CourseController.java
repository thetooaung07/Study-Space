package com.studyspace.controller;

import com.studyspace.dto.*;
import com.studyspace.service.CourseService;
import com.studyspace.types.EnrollmentStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class CourseController {

    private final CourseService courseService;

    // ─── Course Endpoints ──────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<CourseDTO> createCourse(
            @RequestParam Long instructorId,
            @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(instructorId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> updateCourse(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, userId, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<CourseDTO> togglePublish(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(courseService.togglePublish(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable Long id,
            @RequestParam Long userId) {
        courseService.deleteCourse(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<CourseSummaryDTO>> getAllPublishedCourses() {
        return ResponseEntity.ok(courseService.getAllPublishedCourses());
    }

    @GetMapping("/my")
    public ResponseEntity<List<CourseSummaryDTO>> getMyCourses(@RequestParam Long userId) {
        return ResponseEntity.ok(courseService.getMyCourses(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    // ─── Section Endpoints ──────────────────────────────────────────────────────

    @PostMapping("/{id}/sections")
    public ResponseEntity<CourseSectionDTO> addSection(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateSectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.addSection(id, userId, request));
    }

    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<CourseSectionDTO> updateSection(
            @PathVariable Long sectionId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateSectionRequest request) {
        return ResponseEntity.ok(courseService.updateSection(sectionId, userId, request));
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(
            @PathVariable Long sectionId,
            @RequestParam Long userId) {
        courseService.deleteSection(sectionId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Material Endpoints ─────────────────────────────────────────────────────

    @PostMapping(value = "/sections/{sectionId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CourseMaterialDTO> uploadMaterial(
            @PathVariable Long sectionId,
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.uploadMaterial(sectionId, userId, file, title));
    }

    @DeleteMapping("/materials/{materialId}")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long materialId,
            @RequestParam Long userId) {
        courseService.deleteMaterial(materialId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Enrollment Endpoints ───────────────────────────────────────────────────

    @PostMapping("/{id}/enroll")
    public ResponseEntity<CourseEnrollmentDTO> enrollStudent(
            @PathVariable Long id,
            @RequestParam Long studentId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.enrollStudent(id, studentId));
    }

    @DeleteMapping("/{id}/enroll")
    public ResponseEntity<Void> unenroll(
            @PathVariable Long id,
            @RequestParam Long studentId) {
        courseService.unenroll(id, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/enrollments")
    public ResponseEntity<List<CourseEnrollmentDTO>> getEnrollments(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(courseService.getEnrollments(id, userId));
    }

    @PatchMapping("/enrollments/{enrollmentId}")
    public ResponseEntity<CourseEnrollmentDTO> updateEnrollmentStatus(
            @PathVariable Long enrollmentId,
            @RequestParam Long userId,
            @RequestParam EnrollmentStatus status) {
        return ResponseEntity.ok(courseService.updateEnrollmentStatus(enrollmentId, userId, status));
    }

    @GetMapping("/my-enrollments")
    public ResponseEntity<List<CourseEnrollmentDTO>> getMyEnrollments(@RequestParam Long studentId) {
        return ResponseEntity.ok(courseService.getMyEnrollments(studentId));
    }
}
