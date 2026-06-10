package com.studyspace.repository;

import com.studyspace.entity.SpaceGuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

@Repository
public interface SpaceGuestRepository extends JpaRepository<SpaceGuest, Long> {

    boolean existsBySpaceIdAndUserId(Long spaceId, Long userId);

    Optional<SpaceGuest> findBySpaceIdAndUserId(Long spaceId, Long userId);

    /** All spaces a user has joined as a guest */
    Page<SpaceGuest> findByUserId(Long userId, Pageable pageable);

    void deleteBySpaceIdAndUserId(Long spaceId, Long userId);
}
