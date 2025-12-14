package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import com.studyspace.types.UserStatus;
import java.time.LocalDateTime;
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
    private UserStatus currentStatus;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @ToString.Exclude 
    private Set<StudySession> createdSessions = new HashSet<>();
    
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL)
    @ToString.Exclude 
    private Set<StudyGroup> createdGroups = new HashSet<>();
    
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "group_members",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    @ToString.Exclude 
    private Set<StudyGroup> groups = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude 
    private Set<SessionParticipant> participations = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude // Prevent infinite loops
    private Set<Activity> activities = new HashSet<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (currentStatus == null) {
            currentStatus = UserStatus.OFFLINE;
        }
        if (totalStudyMinutes == null) {
            totalStudyMinutes = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}