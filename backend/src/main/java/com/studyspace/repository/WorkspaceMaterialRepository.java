package com.studyspace.repository;

import com.studyspace.entity.WorkspaceMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkspaceMaterialRepository extends JpaRepository<WorkspaceMaterial, Long> {
}
