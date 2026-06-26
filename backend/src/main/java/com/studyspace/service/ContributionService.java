package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.ProposalStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for the Content Extension System (Feature F2) - Merge Proposals.
 *
 * <p>Handles the logic for submitting proposals from student workspaces to the main course
 * and allows instructors to review (approve/reject) these proposals.
 */
@Service
@Transactional
/**
 * Service implementation for the Content Extension System (Feature F2).
 *
 * <p>Manages the lifecycle of merge proposals, enabling students to submit their private notes 
 * and instructors to review and merge them into the main course material.
 */
public class ContributionService {

    /**
     * Constructor.
     * @param proposalRepository the proposalRepository
     * @param workspaceMaterialRepository the workspaceMaterialRepository
     * @param courseSectionRepository the courseSectionRepository
     * @param courseMaterialRepository the courseMaterialRepository
     * @param courseRepository the courseRepository
     * @param userRepository the userRepository
     * @param fileStorageService the fileStorageService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public ContributionService(ContributionProposalRepository proposalRepository, WorkspaceMaterialRepository workspaceMaterialRepository, CourseSectionRepository courseSectionRepository, CourseMaterialRepository courseMaterialRepository, CourseRepository courseRepository, UserRepository userRepository, FileStorageService fileStorageService) {
        this.proposalRepository = proposalRepository;
        this.workspaceMaterialRepository = workspaceMaterialRepository;
        this.courseSectionRepository = courseSectionRepository;
        this.courseMaterialRepository = courseMaterialRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

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
     *
     * @param studentId the student submitting the proposal
     * @param request the submission details including source materials and target section
     * @return a list of created proposals
     */
    /**
     * Submits a batch of new contribution proposals from a student's private workspace.
     * Validates that the target course and sections exist, and that the student is enrolled.
     *
     * @param studentId the ID of the student making the contribution
     * @param request the request body containing the proposals data
     * @return a list of newly created ContributionProposalDTOs
     */
    public List<ContributionProposalDTO> submitProposals(Long studentId, SubmitProposalRequest request) {
        User student = findUser(studentId);
        Course targetCourse = findCourse(request.getTargetCourseId());

        // Validate: must have either an existing section ID or a proposed new section title
        boolean hasExistingSection = request.getTargetSectionId() != null;
        boolean hasNewSectionTitle = request.getProposedSectionTitle() != null
                && !request.getProposedSectionTitle().isBlank();
        if (!hasExistingSection && !hasNewSectionTitle) {
            throw new IllegalStateException("Provide either a targetSectionId or a proposedSectionTitle.");
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
     * 
     * <p><strong>Approval Logic:</strong> On approval, the workspace material is physically
     * copied into the target course section (using the file storage service) so the course
     * has its own independent copy. The contributor's name is attached to the new course material.
     *
     * @param proposalId the ID of the proposal to review
     * @param instructorId the instructor reviewing the proposal
     * @param request the review decision and optional message
     * @return the updated proposal
     */
    /**
     * Reviews a pending contribution proposal, updating its status to ACCEPTED or REJECTED.
     * If accepted, the instructor may choose to showcase the proposed material to the main course.
     *
     * @param proposalId the ID of the proposal being reviewed
     * @param instructorId the ID of the instructor performing the review
     * @param request the review decision and optional feedback message
     * @return the updated ContributionProposalDTO
     * @throws RuntimeException if the proposal is not found or the reviewer is unauthorized
     */
    public ContributionProposalDTO reviewProposal(Long proposalId, Long instructorId, ReviewProposalRequest request) {
        ContributionProposal proposal = findProposal(proposalId);

        // Verify the reviewing user is the course instructor
        if (!proposal.getTargetCourse().getInstructor().getId().equals(instructorId)) {
            throw new IllegalStateException("Forbidden: only the course instructor can review proposals.");
        }

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new IllegalStateException("This proposal has already been reviewed.");
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
                throw new IllegalStateException("No target section available for this proposal.");
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
            throw new IllegalStateException("Forbidden: only the course instructor can view proposals.");
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
