package com.studyspace.repository;

import com.studyspace.entity.WorkspaceSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceSectionRepository extends JpaRepository<WorkspaceSection, Long> {
}
