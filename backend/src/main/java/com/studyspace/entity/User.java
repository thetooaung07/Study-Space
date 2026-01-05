package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import com.studyspace.types.UserStatus;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = "username"),
    @UniqueConstraint(columnNames = "email")
})
@Getter 
@Setter 
@ToString 
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String fullName;
    
    private String profilePictureUrl;
    
    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalStudyMinutes;
    
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'OFFLINE'")
    @Builder.Default
    private UserStatus currentStatus = UserStatus.OFFLINE;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'LOCAL'")
    @Builder.Default
    private com.studyspace.types.AuthProvider authProvider = com.studyspace.types.AuthProvider.LOCAL;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    @Builder.Default
    private Integer currentStreak = 0;

    private LocalDateTime lastStudyDate;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @ToString.Exclude 
    @Builder.Default
    private Set<StudySession> createdSessions = new HashSet<>();
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @ToString.Exclude 
    @Builder.Default
    private Set<StudyGroup> createdGroups = new HashSet<>();
    
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "group_members",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    @ToString.Exclude 
    @Builder.Default
    private Set<StudyGroup> groups = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude 
    @Builder.Default
    private Set<SessionParticipant> participations = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude // Prevent infinite loops
    @Builder.Default
    private Set<Activity> activities = new HashSet<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        updatedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        if (currentStatus == null) {
            currentStatus = UserStatus.OFFLINE;
        }
        if (totalStudyMinutes == null) {
            totalStudyMinutes = 0;
        }
        if (currentStreak == null) {
            currentStreak = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}