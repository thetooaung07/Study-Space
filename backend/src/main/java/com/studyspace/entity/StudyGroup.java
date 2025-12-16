package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "study_groups", uniqueConstraints = {
    @UniqueConstraint(columnNames = "invite_code")
})
@Getter 
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class StudyGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include 
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Column(nullable = false, unique = true)
    private String inviteCode;
    
    @Column(columnDefinition = "BOOLEAN DEFAULT false")
    private Boolean isPrivate;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    @ToString.Exclude // Prevent infinite loops in logs
    private User creator;
    
    @ManyToMany(mappedBy = "groups", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @ToString.Exclude // Prevent infinite loops in logs
    @Builder.Default
    private Set<User> members = new HashSet<>();
    
    @OneToMany(mappedBy = "studyGroup", cascade = CascadeType.ALL)
    @ToString.Exclude // Prevent infinite loops in logs
    @Builder.Default
    private Set<StudySession> sessions = new HashSet<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isPrivate == null) {
            isPrivate = false;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}