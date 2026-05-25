package com.studyspace.repository;

import com.studyspace.entity.ContributionProposal;
import com.studyspace.types.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContributionProposalRepository extends JpaRepository<ContributionProposal, Long> {

    List<ContributionProposal> findByStudentId(Long studentId);

    List<ContributionProposal> findByTargetCourseId(Long courseId);

    List<ContributionProposal> findByTargetCourseIdAndStatus(Long courseId, ProposalStatus status);

    boolean existsBySourceMaterialIdAndStatus(Long materialId, ProposalStatus status);

    boolean existsBySourceMaterialId(Long materialId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE ContributionProposal p SET p.targetSection = null WHERE p.targetSection.id = :sectionId")
    void clearTargetSectionId(Long sectionId);
}
