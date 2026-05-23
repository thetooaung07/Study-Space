package com.studyspace.repository;

import com.studyspace.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Message}.
 *
 * <p>Query methods are ordered by {@code createdAt ASC} so the oldest messages
 * come first — critical for the async compression logic that summarises and evicts
 * the oldest N messages while keeping the most recent ones.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Returns the 10 most recent messages for a conversation (for context injection). */
    List<Message> findTop10ByConversationIdOrderByCreatedAtAsc(String conversationId);

    /** Returns the 5 oldest messages for a conversation (for async compression). */
    List<Message> findTop5ByConversationIdOrderByCreatedAtAsc(String conversationId);

    /** Count of all turns in a conversation — used to decide when to compress. */
    long countByConversationId(String conversationId);

    /** Bulk delete of messages whose IDs have already been summarised. */
    @Modifying
    @Query("DELETE FROM Message m WHERE m.id IN :ids")
    void deleteAllByIdIn(@Param("ids") List<Long> ids);
}
