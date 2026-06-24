package com.studyspace.dto;

import java.time.LocalDateTime;

/**
 * Represents a single persisted message turn, returned by
 * {@code GET /api/chat/conversations/{id}/messages}.
 *
 * <p>The frontend maps {@code role = "assistant"} to its internal {@code "ai"} role
 * for rendering purposes.
 */
public record MessageDTO(
        Long id,
        String role,       // "user" | "assistant"
        String content,
        LocalDateTime createdAt
) {}
