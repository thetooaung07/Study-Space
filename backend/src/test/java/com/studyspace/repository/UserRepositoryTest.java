package com.studyspace.repository;

import com.studyspace.entity.User;
import com.studyspace.types.AuthProvider;
import com.studyspace.types.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsername_ReturnsUser() {
        User user = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password")
                .currentStatus(UserStatus.OFFLINE)
                .authProvider(AuthProvider.LOCAL)
                .build();
        
        entityManager.persist(user);
        entityManager.flush();

        User found = userRepository.findByUsername("testuser").orElse(null);

        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo(user.getUsername());
    }

    @Test
    void existsByEmail_ReturnsTrue() {
        User user = User.builder()
                .username("testuser2")
                .email("test2@example.com")
                .password("password")
                .build();
        
        entityManager.persist(user);
        entityManager.flush();

        boolean exists = userRepository.existsByEmail("test2@example.com");

        assertThat(exists).isTrue();
    }
}
