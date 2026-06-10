package com.studyspace.repository;

import com.studyspace.entity.WorkspaceSpace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface WorkspaceSpaceRepository extends JpaRepository<WorkspaceSpace, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT s FROM WorkspaceSpace s WHERE s.workspace.id = :workspaceId AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<WorkspaceSpace> findByWorkspaceIdWithSearch(@org.springframework.data.repository.query.Param("workspaceId") Long workspaceId, @org.springframework.data.repository.query.Param("search") String search, Pageable pageable);

    Optional<WorkspaceSpace> findByInviteCode(String inviteCode);
}
