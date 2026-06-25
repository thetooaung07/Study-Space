package com.studyspace.dto;

import lombok.Data;

/**
 * Request body for {@code POST /api/chat/query}.
 */
@Data
@SuppressWarnings("java:S1068")
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
     * Can be a local path (development) or an HTTPS URL (S3/Tigris in production).
     * The frontend passes {@code WorkspaceMaterial.fileUrl} directly — no re-upload needed.
     */
    private String documentUrl;

    /**
     * Human-readable title of the tagged document (e.g. "Lecture 3 Slides").
     * Echoed back in the response so the UI can confirm which file was used.
     */
    private String documentTitle;

    /**
     * LLM provider to use for this query.
     * Accepted values: {@code "gemini"} (default) or {@code "openai"}.
     * Falls back to Gemini if absent or unrecognised.
     */
    private String provider;

    /**
     * ID of the authenticated user making the request.
     * Required when {@code conversationId} is provided so the backend can create
     * or verify ownership of the conversation row on the first turn.
     */
    private Long userId;
}

