package com.studyspace.repository;

import com.studyspace.entity.Course;
import com.studyspace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
/**
 * Repository for managing Course entities (Feature F1).
 * Supports fetching courses by instructor and filtering published courses.
 */
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("SELECT c FROM Course c WHERE c.instructor = :instructor AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> findByInstructorWithSearch(@Param("instructor") User instructor, @Param("search") String search, Pageable pageable);

    /**
     * Retrieves a paginated list of all published courses, filtered by a search term.
     * @param search the search term for course title or description
     * @param pageable pagination details
     * @return a page of filtered Course entities
     */
    @Query("SELECT c FROM Course c WHERE c.isPublished = true AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.instructor.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> findByIsPublishedTrueWithSearch(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Course c JOIN c.enrollments e WHERE e.student.id = :studentId AND e.status = 'ACTIVE'")
    Page<Course> findEnrolledCoursesByStudentId(@Param("studentId") Long studentId, Pageable pageable);

    boolean existsByIdAndInstructorId(Long courseId, Long instructorId);
}
