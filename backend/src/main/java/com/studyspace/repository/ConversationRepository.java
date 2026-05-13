package com.studyspace.repository;

import com.studyspace.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for {@link Conversation}.
 *
 * <p>The primary key is a client-supplied UUID string, so no {@code findById} override
 * is needed — the default {@link JpaRepository#findById} works correctly.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {
    // No custom queries needed for the MVP phases.
}
