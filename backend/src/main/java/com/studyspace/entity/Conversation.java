package com.studyspace.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Persists one chat session's hybrid memory:
 * <ul>
 *   <li>{@code summary}         — rolling compressed long-term memory (plain text, updated via LLM)</li>
 *   <li>{@code recentMessages}  — raw short-term message buffer (serialised as JSON text)</li>
 * </ul>
 *
 * <p>The {@code id} is a client-generated UUID string, so no sequence is needed.
 * <p>Uses a custom {@link AttributeConverter} for the messages list to keep the entity
 * compatible with H2 (which has no native JSONB type).
 */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    // ─── Nested message type ─────────────────────────────────────────────────

    /**
     * A single turn in the conversation.
     * Role is "user" or "assistant" to match the Gemini / OpenAI convention.
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessage {
        private String role;      // "user" | "assistant"
        private String content;
        private String timestamp; // ISO-8601
    }

    // ─── JPA AttributeConverter: List<ChatMessage> ↔ TEXT ───────────────────

    @Converter
    public static class MessageListConverter
            implements AttributeConverter<List<ChatMessage>, String> {

        private static final ObjectMapper OM = new ObjectMapper();
        private static final org.slf4j.Logger CONVERTER_LOG =
                org.slf4j.LoggerFactory.getLogger(MessageListConverter.class);

        @Override
        public String convertToDatabaseColumn(List<ChatMessage> messages) {
            if (messages == null) return "[]";
            try {
                return OM.writeValueAsString(messages);
            } catch (Exception e) {
                CONVERTER_LOG.error("[CONVERSATION] Failed to serialise messages to JSON: {}", e.getMessage());
                return "[]";
            }
        }

        @Override
        public List<ChatMessage> convertToEntityAttribute(String json) {
            if (json == null || json.isBlank()) return new ArrayList<>();
            try {
                return OM.readValue(json, new TypeReference<List<ChatMessage>>() {});
            } catch (Exception e) {
                CONVERTER_LOG.error("[CONVERSATION] Failed to deserialise messages from JSON: {}", e.getMessage());
                return new ArrayList<>();
            }
        }
    }

    // ─── Fields ──────────────────────────────────────────────────────────────

    /** Client-supplied UUID (e.g. crypto.randomUUID() from the browser). */
    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    /**
     * Compressed long-term memory.
     * Updated by a separate Gemini call when the recent buffer overflows.
     */
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String summary = "";

    /**
     * Short-term raw message buffer — stored as a JSON array of {@link ChatMessage}.
     * Kept below {@code MAX_RECENT_MESSAGES} entries; older messages are
     * folded into {@code summary} when the threshold is exceeded.
     */
    @Convert(converter = MessageListConverter.class)
    @Column(name = "recent_messages", columnDefinition = "TEXT")
    @Builder.Default
    private List<ChatMessage> recentMessages = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}
