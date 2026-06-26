package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Persists one chat session's long-term memory.
 *
 * <p>Individual turns are stored in the normalized {@link Message} table and queried
 * via {@link com.studyspace.repository.MessageRepository}.
 * This entity carries only the rolling compressed summary that survives buffer compression.
 *
 * <p>The {@code id} is a client-generated UUID string (e.g. {@code crypto.randomUUID()}
 * from the browser), so no sequence is needed.
 */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@AllArgsConstructor
@Builder
public class Conversation {

    /**
     * Default constructor.
     */
    public Conversation() {}

    /** Client-supplied UUID. */
    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    /**
     * The user who owns this conversation.
     * Every conversation is strictly private — one owner, no sharing.
     */
    @Column(name = "user_id", nullable = false, updatable = false)
    private Long userId;

    /**
     * Human-readable label shown in the History popup.
     * Set to 'New Chat' on creation; overwritten by the backend on the first
     * assistant turn by extracting the {@code TITLE: <label>} prefix from the
     * raw LLM output (see {@link com.studyspace.service.MemoryManager}).
     */
    @Column(length = 255)
    @Builder.Default
    private String title = "New Chat";

    /**
     * Compressed long-term memory updated by a separate Gemini call
     * whenever the recent message buffer overflows.
     */
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String summary = "";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    /**
     * Javadoc for Conversation.
     */
    /**
     * Javadoc for Conversation.
     */
    protected void onCreate() {
        LocalDateTime now = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    /**
     * Javadoc for Conversation.
     */
    /**
     * Javadoc for Conversation.
     */
    protected void onUpdate() {
        updatedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}
