package com.studyspace.repository;

import com.studyspace.entity.CourseEnrollment;
import com.studyspace.types.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    List<CourseEnrollment> findByCourseId(Long courseId);

    List<CourseEnrollment> findByStudentId(Long studentId);

    Optional<CourseEnrollment> findByCourseIdAndStudentId(Long courseId, Long studentId);

    boolean existsByCourseIdAndStudentId(Long courseId, Long studentId);

    long countByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
}
