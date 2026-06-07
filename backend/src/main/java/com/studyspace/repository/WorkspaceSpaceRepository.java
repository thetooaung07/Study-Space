package com.studyspace.repository;

import com.studyspace.entity.WorkspaceSpace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceSpaceRepository extends JpaRepository<WorkspaceSpace, Long> {

    List<WorkspaceSpace> findByWorkspaceId(Long workspaceId);

    Optional<WorkspaceSpace> findByInviteCode(String inviteCode);
}
