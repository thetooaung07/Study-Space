package com.studyspace.repository;

import com.studyspace.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link DocumentChunk}.
 *
 * <p>The key query is the native SQL cosine-similarity search using pgvector's
 * {@code <=>} operator (cosine distance). JPA cannot express this in JPQL,
 * so a {@code nativeQuery = true} is required.
 *
 * <p>The embedding is passed as a Postgres vector literal string
 * (e.g. {@code [0.1,0.2,...]}) and cast to {@code vector} inside the query.
 */
@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    /**
     * Deletes all chunks for a given document URL before re-ingestion.
     * Called unconditionally on every upload so stale embeddings never persist.
     */
    @Modifying
    void deleteByDocumentUrl(String documentUrl);

    /**
     * Returns the {@code k} most semantically similar chunks to the query embedding.
     *
     * <p>The {@code <=>} operator computes cosine distance (lower = more similar).
     * The IVFFlat index on the embedding column accelerates this search.
     *
     * @param embedding pgvector string literal, e.g. {@code [0.1,0.2,...]}
     * @param k         number of top results to return
     */
    @Query(value = """
            SELECT content
            FROM document_chunks
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :k
            """, nativeQuery = true)
    List<String> findTopKByEmbedding(@Param("embedding") String embedding,
                                     @Param("k") int k);
}
