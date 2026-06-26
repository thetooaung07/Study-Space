package com.studyspace.repository;

import com.studyspace.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Conversation}.
 *
 * <p>The primary key is a client-supplied UUID string, so no {@code findById} override
 * is needed — the default {@link JpaRepository#findById} works correctly.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    /**
     * Returns all conversations owned by the given user, newest-first.
     * Used to populate the History popup in the AI chat panel.
     * @param userId the userId
     * @return the result
     */
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(Long userId);
}
