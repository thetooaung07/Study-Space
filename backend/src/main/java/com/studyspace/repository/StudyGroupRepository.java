package com.studyspace.repository;

import com.studyspace.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {
    Optional<StudyGroup> findByInviteCode(String inviteCode);

    @org.springframework.data.jpa.repository.Query("SELECT g FROM StudyGroup g WHERE g.creator.id = :userId")
    List<StudyGroup> findByCreatorId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT g FROM User u JOIN u.groups g WHERE u.id = :userId")
    List<StudyGroup> findByMembersId(@org.springframework.data.repository.query.Param("userId") Long userId);
    
    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);
}
