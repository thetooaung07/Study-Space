package com.studyspace.entity;

import com.studyspace.types.MaterialType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;

@Entity
@Table(name = "workspace_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class WorkspaceMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MaterialType fileType = MaterialType.OTHER;

    @Column
    private String originalFileName;

    /**
     * Copy-on-Write flag.
     * true  = this material references the original course file (don't delete file on remove).
     * false = student's own uploaded copy (safe to delete file on remove).
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isReference = false;

    /**
     * Soft-delete flag for reference materials.
     * When a student "deletes" a reference material we cannot remove the DB row
     * (it may be referenced by contribution_proposals), so we just hide it instead.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isHidden = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private WorkspaceSection section;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}
