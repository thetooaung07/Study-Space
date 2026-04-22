package com.studyspace.repository;

import com.studyspace.entity.StudentWorkspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentWorkspaceRepository extends JpaRepository<StudentWorkspace, Long> {

    List<StudentWorkspace> findByOwnerId(Long ownerId);
}
