package com.studyspace.dto;

import com.studyspace.types.ProposalStatus;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
/**
 * Javadoc for ContributionProposalDTO.
 */
/**
 * Javadoc for ContributionProposalDTO.
 */
public class ContributionProposalDTO {

    /**
     * Default constructor.
     */
    public ContributionProposalDTO() {}
    private Long id;
    private ProposalStatus status;
    private String message;
    private String reviewMessage;
    private Long studentId;
    private String studentName;
    private Long targetCourseId;
    private String targetCourseTitle;
    private Long targetSectionId;
    private String targetSectionTitle;
    private String proposedSectionTitle;
    private Long sourceMaterialId;
    private String sourceMaterialTitle;
    private String sourceMaterialUrl;
    private com.studyspace.types.MaterialType sourceMaterialType;
    private String contributorDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
