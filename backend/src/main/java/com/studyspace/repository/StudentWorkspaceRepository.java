package com.studyspace.repository;

import com.studyspace.entity.StudentWorkspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface StudentWorkspaceRepository extends JpaRepository<StudentWorkspace, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT w FROM StudentWorkspace w WHERE w.owner.id = :ownerId AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(w.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<StudentWorkspace> findByOwnerIdWithSearch(@org.springframework.data.repository.query.Param("ownerId") Long ownerId, @org.springframework.data.repository.query.Param("search") String search, Pageable pageable);
}
