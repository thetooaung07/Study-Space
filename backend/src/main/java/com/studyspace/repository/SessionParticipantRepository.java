package com.studyspace.repository;

import com.studyspace.entity.SessionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, Long> {
    List<SessionParticipant> findByStudySessionId(Long sessionId);
    List<SessionParticipant> findByUserId(Long userId);
    Optional<SessionParticipant> findByStudySessionIdAndUserId(Long sessionId, Long userId);
}
