package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_workspaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class StudentWorkspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkspaceSpace> spaces = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
        updatedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}
