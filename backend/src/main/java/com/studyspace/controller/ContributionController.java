package com.studyspace.controller;

import com.studyspace.dto.*;
import com.studyspace.service.ContributionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contributions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ContributionController {

    private final ContributionService contributionService;

    @PostMapping
    public ResponseEntity<List<ContributionProposalDTO>> submitProposals(
            @RequestParam Long studentId,
            @Valid @RequestBody SubmitProposalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contributionService.submitProposals(studentId, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ContributionProposalDTO>> getMyProposals(@RequestParam Long studentId) {
        return ResponseEntity.ok(contributionService.getProposalsByStudent(studentId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ContributionProposalDTO>> getProposalsForCourse(
            @PathVariable Long courseId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(contributionService.getProposalsForCourse(courseId, userId));
    }

    @PatchMapping("/{id}/review")
    public ResponseEntity<ContributionProposalDTO> reviewProposal(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody ReviewProposalRequest request) {
        return ResponseEntity.ok(contributionService.reviewProposal(id, userId, request));
    }

    @GetMapping("/course/{courseId}/accepted")
    public ResponseEntity<List<ContributionProposalDTO>> getAcceptedContributions(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(contributionService.getAcceptedContributions(courseId));
    }
}
