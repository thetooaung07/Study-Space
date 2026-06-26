package com.studyspace.repository;

import com.studyspace.entity.ContributionProposal;
import com.studyspace.types.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
/**
 * Repository for managing Contribution Proposals (Feature F2).
 * Provides custom queries to fetch proposals by status and associated course.
 */
public interface ContributionProposalRepository extends JpaRepository<ContributionProposal, Long> {
    /**
     * Retrieves all contribution proposals submitted by a specific student.
     * @param studentId the ID of the student
     * @return a list of the student's proposals
     */
    List<ContributionProposal> findByStudentId(Long studentId);
    List<ContributionProposal> findByTargetCourseId(Long courseId);
    /**
     * Retrieves all proposals for a specific course filtered by their review status.
     * @param courseId the ID of the course
     * @param status the status of the proposal (e.g., PENDING, ACCEPTED)
     * @return a list of filtered proposals
     */
    List<ContributionProposal> findByTargetCourseIdAndStatus(Long courseId, ProposalStatus status);
    boolean existsBySourceMaterialIdAndStatus(Long materialId, ProposalStatus status);
    boolean existsBySourceMaterialId(Long materialId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ContributionProposal p SET p.targetSection = null WHERE p.targetSection.id = :sectionId")
    /**
     * Bulk updates proposals to detach them from a deleted course section.
     * @param sectionId the ID of the section being deleted
     */
    void clearTargetSectionId(Long sectionId);
}
