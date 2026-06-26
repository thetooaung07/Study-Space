package com.studyspace.repository;

import com.studyspace.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
/**
 * Repository for managing user activities across the platform.
 * Provides queries to fetch recent activities globally, per user, or per session.
 */
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByStudySessionId(Long sessionId);
    List<Activity> findByUserId(Long userId);
    List<Activity> findByStudySessionIdAndTimestampAfter(Long sessionId, LocalDateTime timestamp);
    /**
     * Javadoc for ActivityRepository.
     * @return the result
     */
    List<Activity> findTop20ByOrderByTimestampDesc();
}
