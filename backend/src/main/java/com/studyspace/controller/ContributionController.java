package com.studyspace.controller;

import com.studyspace.dto.*;
import com.studyspace.service.ContributionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the Content Extension System (Feature F2) - Merge Proposals.
 *
 * <p>Handles the submission, review, and listing of contribution proposals.
 */
@RestController
@RequestMapping("/api/contributions")
@CrossOrigin(origins = "http://localhost:3000")
public class ContributionController {

    /**
     * Constructor.
     * @param contributionService the contributionService
     */
    @org.springframework.beans.factory.annotation.Autowired
    public ContributionController(ContributionService contributionService) {
        this.contributionService = contributionService;
    }

    private final ContributionService contributionService;

    @PostMapping
    /**
     * Submits one or more contribution proposals from a student's private workspace.
     *
     * @param studentId the ID of the student submitting the proposal
     * @param request the request body containing the details of the proposals to submit
     * @return a ResponseEntity containing the created ContributionProposalDTOs with status 201 (Created)
     */
    public ResponseEntity<List<ContributionProposalDTO>> submitProposals(
            @RequestParam Long studentId,
            @Valid @RequestBody SubmitProposalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contributionService.submitProposals(studentId, request));
    }

    @GetMapping("/my")
    /**
     * Retrieves all contribution proposals submitted by a specific student.
     *
     * @param studentId the ID of the student
     * @return a ResponseEntity containing a list of the student's proposals
     */
    public ResponseEntity<List<ContributionProposalDTO>> getMyProposals(@RequestParam Long studentId) {
        return ResponseEntity.ok(contributionService.getProposalsByStudent(studentId));
    }

    @GetMapping("/course/{courseId}")
    /**
     * Retrieves all contribution proposals submitted for a specific course.
     *
     * @param courseId the ID of the course
     * @param userId the ID of the user requesting the proposals (must be the instructor)
     * @return a ResponseEntity containing a list of the course's proposals
     */
    public ResponseEntity<List<ContributionProposalDTO>> getProposalsForCourse(
            @PathVariable Long courseId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(contributionService.getProposalsForCourse(courseId, userId));
    }

    @PatchMapping("/{id}/review")
    /**
     * Reviews and updates the status of a pending contribution proposal (approve/reject).
     *
     * @param id the ID of the proposal to review
     * @param userId the ID of the user performing the review (must be the instructor)
     * @param request the request body containing the new status and an optional review message
     * @return a ResponseEntity containing the updated ContributionProposalDTO
     */
    public ResponseEntity<ContributionProposalDTO> reviewProposal(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ReviewProposalRequest request) {
        return ResponseEntity.ok(contributionService.reviewProposal(id, userId, request));
    }

    @GetMapping("/course/{courseId}/accepted")
    /**
     * Retrieves all accepted contribution proposals for a given course to showcase to students.
     *
     * @param courseId the ID of the course
     * @return a ResponseEntity containing a list of accepted ContributionProposalDTOs
     */
    public ResponseEntity<List<ContributionProposalDTO>> getAcceptedContributions(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(contributionService.getAcceptedContributions(courseId));
    }
}
