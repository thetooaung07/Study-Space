package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Stores a single text chunk from a Course Material together with its embedding vector.
 *
 * <p>The {@code embedding} column is typed as {@code vector(768)} (pgvector),
 * matching the output dimension of Google's {@code text-embedding-004} model.
 * Stored as a pgvector string literal (e.g. {@code [0.1,0.2,...]}) and converted
 * by {@link com.studyspace.config.FloatArrayConverter}.
 *
 * <p>Cosine similarity search is performed via a native SQL query in
 * {@link com.studyspace.repository.DocumentChunkRepository} using the {@code <=>} operator.
 */
@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * URL or local path of the originating Course Material.
     * All chunks for a document share this value; used for bulk delete on re-ingestion.
     */
    @Column(name = "document_url", nullable = false, columnDefinition = "TEXT")
    private String documentUrl;

    /** The raw text fragment (roughly 500 tokens) extracted from the document. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 768-dimensional embedding as a pgvector string.
     * Stored and queried via {@link com.studyspace.config.FloatArrayConverter}.
     */
    @Convert(converter = com.studyspace.config.FloatArrayConverter.class)
    @Column(columnDefinition = "vector(768)")
    private float[] embedding;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
