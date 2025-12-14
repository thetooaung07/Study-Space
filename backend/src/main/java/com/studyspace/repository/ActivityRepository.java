package com.studyspace.repository;

import com.studyspace.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByStudySessionId(Long sessionId);
    List<Activity> findByUserId(Long userId);
    List<Activity> findByStudySessionIdAndTimestampAfter(Long sessionId, LocalDateTime timestamp);
    List<Activity> findTop20ByOrderByTimestampDesc();
}
