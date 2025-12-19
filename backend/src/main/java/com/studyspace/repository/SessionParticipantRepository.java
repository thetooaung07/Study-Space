package com.studyspace.repository;

import com.studyspace.dto.GroupMemberStatsDTO;
import com.studyspace.entity.SessionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, Long> {
    List<SessionParticipant> findByStudySessionId(Long sessionId);
    List<SessionParticipant> findByUserId(Long userId);
    Optional<SessionParticipant> findByStudySessionIdAndUserId(Long sessionId, Long userId);
    
    /**
     * Complex JPQL query that joins 4 tables (User, SessionParticipant, StudySession, StudyGroup)
     * to get group member study statistics.
     * 
     * This query demonstrates:
     * - Multiple table JOINs
     * - GROUP BY with multiple columns
     * - HAVING clause for filtering aggregates
     * - Aggregate functions (SUM, COUNT)
     * - ORDER BY on aggregate result
     * - Constructor expression for DTO projection
     * 
     * @param groupId The study group ID to filter by
     * @param since Only include sessions that started after this date
     * @param minMinutes Minimum total minutes threshold (HAVING clause)
     * @return List of GroupMemberStatsDTO with user study statistics
     */
    @Query("""
        SELECT NEW com.studyspace.dto.GroupMemberStatsDTO(
            u.id,
            u.fullName,
            u.profilePictureUrl,
            COALESCE(SUM(sp.minutesParticipated), 0L),
            COUNT(DISTINCT s.id)
        )
        FROM User u
        JOIN SessionParticipant sp ON sp.user = u
        JOIN StudySession s ON sp.studySession = s
        JOIN StudyGroup g ON s.studyGroup = g
        WHERE g.id = :groupId
          AND s.startTime >= :since
          AND sp.leftAt IS NOT NULL
        GROUP BY u.id, u.fullName, u.profilePictureUrl
        HAVING COALESCE(SUM(sp.minutesParticipated), 0) >= :minMinutes
        ORDER BY SUM(sp.minutesParticipated) DESC
    """)
    List<GroupMemberStatsDTO> findGroupMemberStatsByGroupId(
        @Param("groupId") Long groupId,
        @Param("since") LocalDateTime since,
        @Param("minMinutes") Integer minMinutes
    );
}
