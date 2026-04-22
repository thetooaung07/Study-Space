package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.ProposalStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ContributionService {

    private final ContributionProposalRepository proposalRepository;
    private final WorkspaceMaterialRepository workspaceMaterialRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseMaterialRepository courseMaterialRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    /**
     * Submit contribution proposals for one or more workspace materials.
     * Creates one proposal per material (multi-select creates a batch).
     */
    public List<ContributionProposalDTO> submitProposals(Long studentId, SubmitProposalRequest request) {
        User student = findUser(studentId);
        Course targetCourse = findCourse(request.getTargetCourseId());

        // Validate: must have either an existing section ID or a proposed new section title
        boolean hasExistingSection = request.getTargetSectionId() != null;
        boolean hasNewSectionTitle = request.getProposedSectionTitle() != null
                && !request.getProposedSectionTitle().isBlank();
        if (!hasExistingSection && !hasNewSectionTitle) {
            throw new RuntimeException("Provide either a targetSectionId or a proposedSectionTitle.");
        }

        CourseSection targetSection = hasExistingSection
                ? courseSectionRepository.findById(request.getTargetSectionId())
                        .orElseThrow(() -> new RuntimeException("Target section not found: " + request.getTargetSectionId()))
                : null;

        String proposedSectionTitle = hasNewSectionTitle ? request.getProposedSectionTitle().trim() : null;

        List<ContributionProposalDTO> results = new ArrayList<>();
        List<Long> distinctMaterialIds = request.getSourceMaterialIds().stream().distinct().collect(Collectors.toList());

        for (Long materialId : distinctMaterialIds) {
            WorkspaceMaterial sourceMaterial = workspaceMaterialRepository.findById(materialId)
                    .orElseThrow(() -> new RuntimeException("Workspace material not found: " + materialId));

            // Prevent duplicate pending proposals for the same material to the same section
            boolean exists = proposalRepository.existsBySourceMaterialIdAndStatus(materialId, ProposalStatus.PENDING);
            if (exists) {
                continue; // Skip if already pending
            }

            ContributionProposal proposal = ContributionProposal.builder()
                    .status(ProposalStatus.PENDING)
                    .message(request.getMessage())
                    .student(student)
                    .targetCourse(targetCourse)
                    .targetSection(targetSection)
                    .proposedSectionTitle(proposedSectionTitle)
                    .sourceMaterial(sourceMaterial)
                    .contributorDisplayName(student.getFullName())
                    .build();

            results.add(toDTO(proposalRepository.save(proposal)));
        }

        return results;
    }

    /**
     * Instructor reviews a proposal — approve or reject.
     * On approval: the workspace material is copied into the target course section
     * with the contributor's name attached.
     */
    public ContributionProposalDTO reviewProposal(Long proposalId, Long instructorId, ReviewProposalRequest request) {
        ContributionProposal proposal = findProposal(proposalId);

        // Verify the reviewing user is the course instructor
        if (!proposal.getTargetCourse().getInstructor().getId().equals(instructorId)) {
            throw new RuntimeException("Forbidden: only the course instructor can review proposals.");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new RuntimeException("This proposal has already been reviewed.");
        }

        proposal.setStatus(request.getStatus());
        proposal.setReviewMessage(request.getReviewMessage());
        proposal.setReviewedAt(Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime());

        if (request.getStatus() == ProposalStatus.APPROVED) {
            WorkspaceMaterial source = proposal.getSourceMaterial();
            CourseSection targetSection = proposal.getTargetSection();

            // If the student proposed a brand-new section, create it now
            if (targetSection == null && proposal.getProposedSectionTitle() != null) {
                // Place the new section after the last existing one
                int nextOrder = proposal.getTargetCourse().getSections() != null
                        ? proposal.getTargetCourse().getSections().size()
                        : 0;
                targetSection = CourseSection.builder()
                        .title(proposal.getProposedSectionTitle())
                        .course(proposal.getTargetCourse())
                        .orderIndex(nextOrder)
                        .build();
                targetSection = courseSectionRepository.save(targetSection);
                // Link the proposal to the newly created section for traceability
                proposal.setTargetSection(targetSection);
            }

            if (targetSection == null) {
                throw new RuntimeException("No target section available for this proposal.");
            }

            // Copy the file so the course has its own copy
            String copiedFileUrl = fileStorageService.copy(source.getFileUrl(), "courses");

            CourseMaterial courseMaterial = CourseMaterial.builder()
                    .title(source.getTitle())
                    .fileUrl(copiedFileUrl)
                    .fileType(source.getFileType())
                    .originalFileName(source.getOriginalFileName())
                    .contributorName(proposal.getContributorDisplayName())
                    .section(targetSection)
                    .build();
            courseMaterialRepository.save(courseMaterial);
        }

        return toDTO(proposalRepository.save(proposal));
    }

    @Transactional(readOnly = true)
    public List<ContributionProposalDTO> getProposalsByStudent(Long studentId) {
        return proposalRepository.findByStudentId(studentId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContributionProposalDTO> getProposalsForCourse(Long courseId, Long instructorId) {
        Course course = findCourse(courseId);
        if (!course.getInstructor().getId().equals(instructorId)) {
            throw new RuntimeException("Forbidden: only the course instructor can view proposals.");
        }
        return proposalRepository.findByTargetCourseId(courseId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContributionProposalDTO> getAcceptedContributions(Long courseId) {
        return proposalRepository.findByTargetCourseIdAndStatus(courseId, ProposalStatus.APPROVED)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
    }

    private ContributionProposal findProposal(Long id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found: " + id));
    }

    private ContributionProposalDTO toDTO(ContributionProposal p) {
        return ContributionProposalDTO.builder()
                .id(p.getId())
                .status(p.getStatus())
                .message(p.getMessage())
                .reviewMessage(p.getReviewMessage())
                .studentId(p.getStudent().getId())
                .studentName(p.getStudent().getFullName())
                .targetCourseId(p.getTargetCourse().getId())
                .targetCourseTitle(p.getTargetCourse().getTitle())
                .targetSectionId(p.getTargetSection() != null ? p.getTargetSection().getId() : null)
                .targetSectionTitle(p.getTargetSection() != null ? p.getTargetSection().getTitle() : null)
                .proposedSectionTitle(p.getProposedSectionTitle())
                .sourceMaterialId(p.getSourceMaterial() != null ? p.getSourceMaterial().getId() : null)
                .sourceMaterialTitle(p.getSourceMaterial() != null ? p.getSourceMaterial().getTitle() : null)
                .sourceMaterialUrl(p.getSourceMaterial() != null ? p.getSourceMaterial().getFileUrl() : null)
                .sourceMaterialType(p.getSourceMaterial() != null ? p.getSourceMaterial().getFileType() : null)
                .contributorDisplayName(p.getContributorDisplayName())
                .createdAt(p.getCreatedAt())
                .reviewedAt(p.getReviewedAt())
                .build();
    }
}
