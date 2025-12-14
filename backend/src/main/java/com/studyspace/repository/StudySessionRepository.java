package com.studyspace.repository;

import com.studyspace.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByCreatorId(Long userId);
    List<StudySession> findByCreatorIdAndStartTimeAfter(Long userId, LocalDateTime startTime);
    Optional<StudySession> findByRoomCode(String roomCode);
    List<StudySession> findByStudyGroupId(Long groupId);
    List<StudySession> findByStudyGroupIdAndStartTimeAfter(Long groupId, LocalDateTime startTime);
    long countByStartTimeAfter(LocalDateTime startTime);
}
