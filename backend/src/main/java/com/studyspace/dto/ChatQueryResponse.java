package com.studyspace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response body for POST /api/chat/query.
 */
@Data
@AllArgsConstructor
public class ChatQueryResponse {

    /**
     * Default constructor.
     */
    public ChatQueryResponse() {}

    /** The AI-generated answer (TITLE: prefix already stripped). */
    private String answer;

    /** Title of the document used as context, or null if no document was provided. */
    private String contextDocumentTitle;

    /**
     * The LLM-generated conversation title extracted from the first assistant reply.
     * Non-null only on the very first turn of a new conversation (when the backend
     * detects {@code conversations.title = 'New Chat'} and strips the
     * {@code TITLE: <label>} prefix). Null on all subsequent turns.
     *
     * <p>The frontend uses this to update the History popup list entry immediately
     * after the first reply, without a separate rename API call.
     */
    private String conversationTitle;
}
