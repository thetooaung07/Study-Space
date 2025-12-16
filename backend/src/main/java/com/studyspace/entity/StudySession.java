package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import com.studyspace.types.SessionStatus;
import com.studyspace.types.Subject;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class StudySession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    private String description;
    
    @Enumerated(EnumType.STRING)
    private Subject subject;
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    private Integer durationMinutes;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean isGroupSession;
    
    @Column(unique = true)
    private String roomCode;
    
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'SCHEDULED'")
    private SessionStatus status;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User creator;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_group_id")
    private StudyGroup studyGroup;
    
    @OneToMany(mappedBy = "studySession", cascade = CascadeType.ALL)
    @ToString.Exclude 
    @Builder.Default
    private Set<SessionParticipant> participants = new HashSet<>();
    
    @OneToMany(mappedBy = "studySession", cascade = CascadeType.ALL)
    @ToString.Exclude 
    @Builder.Default
    private Set<Activity> activities = new HashSet<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startTime = LocalDateTime.now();
        if (status == null) {
            status = SessionStatus.SCHEDULED;
        }
        if (isGroupSession == null) {
            isGroupSession = false;
        }
    }
}
