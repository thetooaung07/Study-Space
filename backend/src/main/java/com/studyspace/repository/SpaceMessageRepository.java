package com.studyspace.repository;

import com.studyspace.entity.SpaceMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpaceMessageRepository extends JpaRepository<SpaceMessage, Long> {

    List<SpaceMessage> findBySpaceIdOrderByCreatedAtAsc(Long spaceId);
}
