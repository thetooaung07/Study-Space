package com.studyspace.dto;

import com.studyspace.types.ProposalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewProposalRequest {

    @NotNull(message = "Status is required")
    private ProposalStatus status;

    private String reviewMessage;
}
