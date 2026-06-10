package com.studyspace.repository;

import com.studyspace.entity.CourseEnrollment;
import com.studyspace.types.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    List<CourseEnrollment> findByCourseId(Long courseId);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.student.id = :studentId AND e.course.isPublished = true")
    Page<CourseEnrollment> findPublishedByStudentId(@Param("studentId") Long studentId, Pageable pageable);

    @Query("SELECT e FROM CourseEnrollment e WHERE e.student.id = :studentId AND e.course.isPublished = true AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(e.course.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.course.instructor.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.course.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<CourseEnrollment> findPublishedByStudentIdWithSearch(@Param("studentId") Long studentId, @Param("search") String search, Pageable pageable);

    Optional<CourseEnrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);

    boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);

    long countByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
}
