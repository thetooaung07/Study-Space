package com.studyspace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workspace_spaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class WorkspaceSpace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private StudentWorkspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forked_from_course_id")
    private Course forkedFromCourse;

    @Column(unique = true)
    private String inviteCode;

    @Column(nullable = false)
    @Builder.Default
    private Boolean sharingEnabled = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublished = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "space", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<WorkspaceSection> sections = new ArrayList<>();

    @OneToMany(mappedBy = "space", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SpaceGuest> guests = new ArrayList<>();

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
