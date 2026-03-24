package com.studyspace.repository;

import com.studyspace.entity.Course;
import com.studyspace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByInstructor(User instructor);

    List<Course> findByIsPublishedTrue();

    @Query("SELECT c FROM Course c JOIN c.enrollments e WHERE e.student.id = :studentId AND e.status = 'ACTIVE'")
    List<Course> findEnrolledCoursesByStudentId(@Param("studentId") Long studentId);

    boolean existsByIdAndInstructorId(Long courseId, Long instructorId);
}
