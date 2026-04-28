package com.studyspace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body for POST /api/chat/query.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatQueryResponse {

    /** The AI-generated answer. */
    private String answer;

    /** Title of the document used as context, or null if no document was provided. */
    private String contextDocumentTitle;
}
