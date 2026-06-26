package com.studyspace.dto;

import java.time.LocalDateTime;

/**
 * Lightweight projection of a {@link com.studyspace.entity.Conversation} used in the
 * History popup list on the AI chat panel.
 *
 * <p>Only the fields needed to render the sidebar entry are included — the full message
 * list is fetched separately when the user selects a conversation.
 * @param id the id
 * @param title the title
 */
public record ConversationSummaryDTO(
        String id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
