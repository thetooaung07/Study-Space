package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import com.studyspace.types.ActivityType;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "activity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType type;
    
    private String message;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_session_id", nullable = true)
    private StudySession studySession;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Before Insert to database
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        }
    }
}
