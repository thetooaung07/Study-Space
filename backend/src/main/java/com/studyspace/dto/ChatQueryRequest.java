package com.studyspace.dto;

import lombok.Data;

/**
 * Request body for {@code POST /api/chat/query}.
 */
@Data
public class ChatQueryRequest {

    /**
     * Client-generated UUID that identifies the chat session.
     * If null or blank, the backend treats the call as a stateless
     * (no-memory) request — backward-compatible.
     */
    private String conversationId;

    /** The student's question. */
    private String question;

    /**
     * Optional URL of the document the student tagged with the @ shortcut.
     * Can be a local path (development) or an HTTPS URL (S3/GCS in production).
     * The frontend passes {@code WorkspaceMaterial.fileUrl} directly — no re-upload needed.
     */
    private String documentUrl;

    /**
     * Human-readable title of the tagged document (e.g. "Lecture 3 Slides").
     * Echoed back in the response so the UI can confirm which file was used.
     */
    private String documentTitle;
}

