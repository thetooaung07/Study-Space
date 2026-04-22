package com.studyspace.entity;

import com.studyspace.types.ProposalStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;

@Entity
@Table(name = "contribution_proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ContributionProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String reviewMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_course_id", nullable = false)
    private Course targetCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_section_id")
    private CourseSection targetSection;

    /** Title for a new section proposed by the student (used when targetSection is null). */
    @Column
    private String proposedSectionTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_material_id")
    private WorkspaceMaterial sourceMaterial;

    @Column
    private String contributorDisplayName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}
