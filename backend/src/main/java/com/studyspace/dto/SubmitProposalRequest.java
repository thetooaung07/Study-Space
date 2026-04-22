package com.studyspace.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitProposalRequest {

    private String message;

    @NotNull(message = "Target course ID is required")
    private Long targetCourseId;

    /**
     * ID of an existing course section to target.
     * Mutually exclusive with proposedSectionTitle.
     */
    private Long targetSectionId;

    /**
     * Title for a brand-new section the student wants added to the course.
     * Used when the student added a section in their workspace that doesn't
     * exist in the original course yet.
     * Mutually exclusive with targetSectionId.
     */
    private String proposedSectionTitle;

    /**
     * List of workspace material IDs the student wants to contribute.
     * Supports multi-select: one or more materials can be proposed at once.
     */
    @NotNull(message = "At least one material must be selected")
    private List<Long> sourceMaterialIds;
}
