package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Represents a single conversation turn stored in the normalized {@code messages} table.
 *
 * <p>Replaces the JSON blob previously held in {@code conversations.recent_messages}.
 * Queried by {@link com.studyspace.repository.MessageRepository} for both context injection
 * and async compression (the oldest N rows are summarised then deleted).
 */
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** UUID of the owning {@link Conversation}. */
    @Column(name = "conversation_id", nullable = false, length = 36)
    private String conversationId;

    /** {@code "user"} or {@code "assistant"} — matches the Gemini / OpenAI convention. */
    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
