package com.studyspace.repository;

import com.studyspace.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    long countByCurrentStatus(com.studyspace.types.UserStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(u.totalStudyMinutes), 0) FROM User u")
    long sumTotalStudyMinutes();
}
