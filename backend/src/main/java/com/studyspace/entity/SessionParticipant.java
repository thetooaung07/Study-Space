package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "session_participants", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"study_session_id", "user_id"})
})
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SessionParticipant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @Column(nullable = false)
    private LocalDateTime joinedAt;
    
    private LocalDateTime leftAt;
    
    private Integer minutesParticipated;
    
    private LocalDateTime lastPausedAt;
    
    @Builder.Default
    private Long totalPausedSeconds = 0L;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_session_id", nullable = false)
    private StudySession studySession;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Before Insert to database
    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        }
    }
}
