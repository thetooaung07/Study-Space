package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.MaterialType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.security.SecureRandom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;

/**
 * Service implementation for the Content Extension System (Feature F2).
 *
 * <p>Manages workspaces, spaces, and handles complex operations like course forking
 * (copy-on-write references) and soft-deletes for materials with active proposals.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StudentWorkspaceRepository workspaceRepository;
    private final WorkspaceSpaceRepository spaceRepository;
    private final WorkspaceSectionRepository sectionRepository;
    private final WorkspaceMaterialRepository materialRepository;
    private final ContributionProposalRepository proposalRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final SpaceGuestRepository guestRepository;
    private final FileStorageService fileStorageService;
    private final com.studyspace.repository.CourseMaterialRepository courseMaterialRepository;

    // ─── Workspace CRUD ─────────────────────────────────────────────────────────

    public StudentWorkspaceDTO createWorkspace(Long ownerId, CreateWorkspaceRequest request) {
        User owner = findUser(ownerId);
        StudentWorkspace workspace = StudentWorkspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();
        return toWorkspaceDTO(workspaceRepository.save(workspace));
    }

    public StudentWorkspaceDTO updateWorkspace(Long workspaceId, Long userId, CreateWorkspaceRequest request) {
        StudentWorkspace workspace = findWorkspace(workspaceId);
        assertOwner(workspace, userId);
        workspace.setName(request.getName());
        workspace.setDescription(request.getDescription());
        return toWorkspaceDTO(workspaceRepository.save(workspace));
    }

    public void deleteWorkspace(Long workspaceId, Long userId) {
        StudentWorkspace workspace = findWorkspace(workspaceId);
        assertOwner(workspace, userId);
        for (WorkspaceSpace space : workspace.getSpaces()) {
            for (WorkspaceSection section : space.getSections()) {
                purgeMaterials(section);
            }
        }
        workspaceRepository.delete(workspace);
    }

    @Transactional(readOnly = true)
    public Page<StudentWorkspaceDTO> getMyWorkspaces(Long ownerId, String search, Pageable pageable) {
        return workspaceRepository.findByOwnerIdWithSearch(ownerId, search, pageable)
                .map(this::toWorkspaceDTO);
    }

    @Transactional(readOnly = true)
    public Page<StudentWorkspaceDTO> getPublicWorkspaces(Pageable pageable) {
        return workspaceRepository.findAll(pageable).map(this::toWorkspaceDTO);
    }

    @Transactional(readOnly = true)
    public StudentWorkspaceDTO getWorkspaceById(Long workspaceId, Long requestingUserId) {
        StudentWorkspace workspace = findWorkspace(workspaceId);
        assertOwner(workspace, requestingUserId);
        return toWorkspaceDTO(workspace);
    }

    // ─── Space CRUD ─────────────────────────────────────────────────────────────

    public WorkspaceSpaceDTO createSpace(Long workspaceId, Long userId, CreateSpaceRequest request) {
        StudentWorkspace workspace = findWorkspace(workspaceId);
        assertOwner(workspace, userId);
        WorkspaceSpace space = WorkspaceSpace.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .workspace(workspace)
                .build();
        return toSpaceDTO(spaceRepository.save(space), userId);
    }

    @Transactional(readOnly = true)
    public Page<WorkspaceSpaceDTO> getSpacesByWorkspace(Long workspaceId, Long requestingUserId, String search, Pageable pageable) {
        StudentWorkspace workspace = findWorkspace(workspaceId);
        assertOwner(workspace, requestingUserId);
        return spaceRepository.findByWorkspaceIdWithSearch(workspaceId, search, pageable)
                .map(s -> toSpaceDTO(s, requestingUserId));
    }

    /**
     * Fork (deep-copy) a course into a workspace space.
     * Materials are created as references (copy-on-write) instead of duplicating the physical files.
     * This saves storage and allows tracking the original source for future merge proposals.
     *
     * @param workspaceId the target workspace
     * @param userId the user performing the fork
     * @param courseId the source course to fork
     * @param customTitle optional custom title for the new space
     * @return the newly created space containing referenced materials
     */
    public WorkspaceSpaceDTO forkCourse(Long workspaceId, Long userId, Long courseId, String customTitle) {
        StudentWorkspace workspace = findWorkspace(workspaceId);
        assertOwner(workspace, userId);
        Course course = findCourse(courseId);

        WorkspaceSpace space = WorkspaceSpace.builder()
                .title(customTitle != null ? customTitle : course.getTitle())
                .description(course.getDescription())
                .workspace(workspace)
                .forkedFromCourse(course)
                .build();
        space = spaceRepository.save(space);

        for (CourseSection courseSection : course.getSections()) {
            WorkspaceSection wsSection = WorkspaceSection.builder()
                    .title(courseSection.getTitle())
                    .description(courseSection.getDescription())
                    .orderIndex(courseSection.getOrderIndex())
                    .space(space)
                    .createdBy(workspace.getOwner())
                    .build();
            wsSection = sectionRepository.save(wsSection);

            for (CourseMaterial courseMaterial : courseSection.getMaterials()) {
                WorkspaceMaterial wsMaterial = WorkspaceMaterial.builder()
                        .title(courseMaterial.getTitle())
                        .fileUrl(courseMaterial.getFileUrl())
                        .fileType(courseMaterial.getFileType())
                        .originalFileName(courseMaterial.getOriginalFileName())
                        .isReference(true)
                        .section(wsSection)
                        .createdBy(workspace.getOwner())
                        .build();
                materialRepository.save(wsMaterial);
            }
        }

        return toSpaceDTO(spaceRepository.findById(space.getId()).orElseThrow(), userId);
    }

    public WorkspaceSpaceDTO updateSpace(Long spaceId, Long userId, CreateSpaceRequest request) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        space.setTitle(request.getTitle());
        space.setDescription(request.getDescription());
        return toSpaceDTO(spaceRepository.save(space), userId);
    }

    public void deleteSpace(Long spaceId, Long userId) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        for (WorkspaceSection section : space.getSections()) {
            purgeMaterials(section);
        }
        spaceRepository.delete(space);
    }

    @Transactional(readOnly = true)
    public WorkspaceSpaceDTO getSpaceById(Long spaceId, Long requestingUserId) {
        WorkspaceSpace space = findSpace(spaceId);
        Long ownerId = space.getWorkspace().getOwner().getId();
        boolean isOwner = ownerId.equals(requestingUserId);
        boolean isGuest = guestRepository.existsBySpaceIdAndUserId(spaceId, requestingUserId);

        if (!isOwner && !isGuest) {
            throw new IllegalStateException("Forbidden: you do not have access to this space.");
        }
        return toSpaceDTO(space, requestingUserId);
    }

    // ─── Space Sharing ───────────────────────────────────────────────────────────

    /** Owner enables sharing and gets the invite code (generates one if not yet set). */
    public ShareSettingsDTO enableSharing(Long spaceId, Long userId) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        if (space.getInviteCode() == null) {
            space.setInviteCode(generateCode());
        }
        space.setSharingEnabled(true);
        spaceRepository.save(space);
        return ShareSettingsDTO.builder()
                .sharingEnabled(true)
                .inviteCode(space.getInviteCode())
                .guestCount(space.getGuests().size())
                .build();
    }

    /** Owner disables sharing (code is preserved but unusable until re-enabled). */
    public void disableSharing(Long spaceId, Long userId) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        space.setSharingEnabled(false);
        spaceRepository.save(space);
    }

    /** Owner regenerates the invite code, invalidating the old one. */
    public ShareSettingsDTO regenerateInviteCode(Long spaceId, Long userId) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        space.setInviteCode(generateCode());
        space.setSharingEnabled(true);
        spaceRepository.save(space);
        return ShareSettingsDTO.builder()
                .sharingEnabled(true)
                .inviteCode(space.getInviteCode())
                .guestCount(space.getGuests().size())
                .build();
    }

    /** Any authenticated user joins a space by pasting the invite code. */
    public WorkspaceSpaceDTO joinByCode(String inviteCode, Long userId) {
        WorkspaceSpace space = spaceRepository.findByInviteCode(inviteCode.trim().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Invalid invitation code."));

        if (!Boolean.TRUE.equals(space.getSharingEnabled())) {
            throw new IllegalStateException("Sharing has been disabled for this space.");
        }

        Long ownerId = space.getWorkspace().getOwner().getId();
        if (ownerId.equals(userId)) {
            throw new IllegalStateException("You are already the owner of this space.");
        }

        if (guestRepository.existsBySpaceIdAndUserId(space.getId(), userId)) {
            // Already a guest — just return the DTO (idempotent)
            return toSpaceDTO(space, userId);
        }

        User user = findUser(userId);
        SpaceGuest guest = SpaceGuest.builder()
                .space(space)
                .user(user)
                .build();
        guestRepository.save(guest);
        return toSpaceDTO(space, userId);
    }

    /** Guest removes themselves from a shared space. */
    public void leaveSpace(Long spaceId, Long userId) {
        SpaceGuest guest = guestRepository.findBySpaceIdAndUserId(spaceId, userId)
                .orElseThrow(() -> new RuntimeException("You are not a guest of this space."));
        guestRepository.delete(guest);
    }

    /** Returns all spaces the user has joined as a guest. */
    @Transactional(readOnly = true)
    public Page<WorkspaceSpaceDTO> getSharedSpaces(Long userId, Pageable pageable) {
        return guestRepository.findByUserId(userId, pageable)
                .map(SpaceGuest::getSpace)
                .map(s -> toSpaceDTO(s, userId));
    }

    /** Owner removes a guest from their space. */
    public void removeGuest(Long spaceId, Long guestUserId, Long requestingUserId) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), requestingUserId);
        SpaceGuest guest = guestRepository.findBySpaceIdAndUserId(spaceId, guestUserId)
                .orElseThrow(() -> new RuntimeException("User is not a guest of this space."));
        guestRepository.delete(guest);
    }

    // ─── Section CRUD ───────────────────────────────────────────────────────────

    public WorkspaceSectionDTO addSection(Long spaceId, Long userId, CreateWorkspaceSectionRequest request) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwnerOrGuest(space, userId);
        User creator = findUser(userId);
        WorkspaceSection section = WorkspaceSection.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : space.getSections().size())
                .space(space)
                .createdBy(creator)
                .build();
        return toSectionDTO(sectionRepository.save(section));
    }

    public WorkspaceSectionDTO updateSection(Long sectionId, Long userId, CreateWorkspaceSectionRequest request) {
        WorkspaceSection section = findSection(sectionId);
        assertOwner(section.getSpace().getWorkspace(), userId);
        section.setTitle(request.getTitle());
        section.setDescription(request.getDescription());
        if (request.getOrderIndex() != null) {
            section.setOrderIndex(request.getOrderIndex());
        }
        return toSectionDTO(sectionRepository.save(section));
    }

    public void deleteSection(Long sectionId, Long userId) {
        WorkspaceSection section = findSection(sectionId);
        WorkspaceSpace space = section.getSpace();
        Long ownerId = space.getWorkspace().getOwner().getId();
        boolean isOwner = ownerId.equals(userId);
        boolean isOwnSection = section.getCreatedBy() != null && section.getCreatedBy().getId().equals(userId);

        if (!isOwner && !isOwnSection) {
            throw new IllegalStateException("Forbidden: you can only delete your own sections.");
        }
        purgeMaterials(section);
        sectionRepository.delete(section);
    }

    /**
     * Processes every material in a section before the section (or its ancestor) is deleted.
     * 
     * <p>Applies the same soft-delete logic as {@link #deleteMaterial(Long, Long)} to prevent
     * breaking active contribution proposals when a parent section is deleted.
     * 
     * @param section the section being purged
     */
    private void purgeMaterials(WorkspaceSection section) {
        for (WorkspaceMaterial material : section.getMaterials()) {
            boolean hasProposal = proposalRepository.existsBySourceMaterialId(material.getId());
            if (hasProposal) {
                material.setIsHidden(true);
                material.setSection(null);
                materialRepository.save(material);
            } else {
                if (!Boolean.TRUE.equals(material.getIsReference())) {
                    fileStorageService.delete(material.getFileUrl());
                }
                materialRepository.delete(material);
            }
        }
    }

    // ─── Material Upload ────────────────────────────────────────────────────────

    public WorkspaceMaterialDTO uploadMaterial(Long sectionId, Long userId,
                                               MultipartFile file, String title) {
        WorkspaceSection section = findSection(sectionId);
        assertOwnerOrGuest(section.getSpace(), userId);

        String fileUrl = fileStorageService.store(file, "workspaces");
        MaterialType fileType = detectFileType(file.getOriginalFilename());
        User creator = findUser(userId);

        WorkspaceMaterial material = WorkspaceMaterial.builder()
                .title(title)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .originalFileName(file.getOriginalFilename())
                .isReference(false)
                .section(section)
                .createdBy(creator)
                .build();
        return toMaterialDTO(materialRepository.save(material));
    }

    /**
     * Deletes a material from a workspace section.
     *
     * <p><strong>Soft Delete Logic:</strong> If the material has an active {@link com.studyspace.entity.ContributionProposal},
     * it cannot be hard-deleted because the instructor needs to review it. Instead, the material
     * is flagged as hidden ({@code isHidden = true}) and retained in the database until the proposal is resolved.
     * If no active proposal exists, the physical file (if not a reference) and the DB record are permanently deleted.
     *
     * @param materialId the ID of the material to delete
     * @param userId the ID of the user requesting the deletion (must be owner or creator)
     */
    public void deleteMaterial(Long materialId, Long userId) {
        WorkspaceMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found: " + materialId));

        Long ownerId = material.getSection().getSpace().getWorkspace().getOwner().getId();
        boolean isOwner = ownerId.equals(userId);
        boolean isOwnMaterial = material.getCreatedBy() != null && material.getCreatedBy().getId().equals(userId);

        if (!isOwner && !isOwnMaterial) {
            throw new IllegalStateException("Forbidden: you can only delete your own materials.");
        }

        boolean hasProposal = proposalRepository.existsBySourceMaterialId(materialId);
        if (hasProposal) {
            material.setIsHidden(true);
            materialRepository.save(material);
        } else {
            if (!Boolean.TRUE.equals(material.getIsReference())) {
                String fileUrl = material.getFileUrl();
                materialRepository.delete(material);

                boolean hasCourseRefs = courseMaterialRepository.existsByFileUrl(fileUrl);
                boolean hasWorkspaceRefs = materialRepository.existsByFileUrl(fileUrl);
                if (!hasCourseRefs && !hasWorkspaceRefs) {
                    fileStorageService.delete(fileUrl);
                }
            } else {
                materialRepository.delete(material);
            }
        }
    }

    // ─── Helpers & Auth ──────────────────────────────────────────────────────────

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
    }

    private StudentWorkspace findWorkspace(Long id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workspace not found: " + id));
    }

    private WorkspaceSpace findSpace(Long id) {
        return spaceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Space not found: " + id));
    }

    private WorkspaceSection findSection(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Section not found: " + id));
    }

    /** Throws if the requesting user is not the workspace owner. */
    private void assertOwner(StudentWorkspace workspace, Long userId) {
        if (!workspace.getOwner().getId().equals(userId)) {
            throw new IllegalStateException("Forbidden: only the workspace owner can perform this action.");
        }
    }

    /** Allows both the workspace owner AND accepted guests to proceed. */
    private void assertOwnerOrGuest(WorkspaceSpace space, Long userId) {
        Long ownerId = space.getWorkspace().getOwner().getId();
        if (ownerId.equals(userId)) return;
        if (guestRepository.existsBySpaceIdAndUserId(space.getId(), userId)) return;
        throw new IllegalStateException("Forbidden: you are not a member of this space.");
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder("SPACE-");
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    private MaterialType detectFileType(String filename) {
        if (filename == null) return MaterialType.OTHER;
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return MaterialType.PDF;
        if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return MaterialType.SLIDES;
        if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".avi")) return MaterialType.VIDEO;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return MaterialType.IMAGE;
        return MaterialType.OTHER;
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────────

    private StudentWorkspaceDTO toWorkspaceDTO(StudentWorkspace workspace) {
        return StudentWorkspaceDTO.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .ownerId(workspace.getOwner().getId())
                .ownerName(workspace.getOwner().getFullName())
                .spaceCount(workspace.getSpaces().size())
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }

    private WorkspaceSpaceDTO toSpaceDTO(WorkspaceSpace space, Long requestingUserId) {
        Long ownerId = space.getWorkspace().getOwner().getId();
        boolean isOwner = ownerId.equals(requestingUserId);
        boolean isGuest = !isOwner && guestRepository.existsBySpaceIdAndUserId(space.getId(), requestingUserId);

        User owner = space.getWorkspace().getOwner();
        List<com.studyspace.dto.SpaceMemberDTO> members = new java.util.ArrayList<>();
        
        // Add Owner
        members.add(com.studyspace.dto.SpaceMemberDTO.builder()
                .id(owner.getId())
                .fullName(owner.getFullName())
                .username(owner.getUsername())
                .profilePictureUrl(owner.getProfilePictureUrl())
                .role("OWNER")
                .build());
                
        // Add Guests
        space.getGuests().forEach(guest -> {
            User u = guest.getUser();
            members.add(com.studyspace.dto.SpaceMemberDTO.builder()
                    .id(u.getId())
                    .fullName(u.getFullName())
                    .username(u.getUsername())
                    .profilePictureUrl(u.getProfilePictureUrl())
                    .role("GUEST")
                    .build());
        });

        return WorkspaceSpaceDTO.builder()
                .id(space.getId())
                .title(space.getTitle())
                .description(space.getDescription())
                .workspaceId(space.getWorkspace().getId())
                .forkedFromCourseId(space.getForkedFromCourse() != null ? space.getForkedFromCourse().getId() : null)
                .forkedFromCourseTitle(space.getForkedFromCourse() != null ? space.getForkedFromCourse().getTitle() : null)
                .isPublished(space.getIsPublished())
                .createdAt(space.getCreatedAt())
                .updatedAt(space.getUpdatedAt())
                .sections(space.getSections().stream().map(this::toSectionDTO).toList())
                .sharingEnabled(space.getSharingEnabled())
                .inviteCode(isOwner ? space.getInviteCode() : null) // only expose to owner
                .guestCount(space.getGuests().size())
                .isGuest(isGuest)
                .members(members)
                .build();
    }

    private WorkspaceSectionDTO toSectionDTO(WorkspaceSection section) {
        return WorkspaceSectionDTO.builder()
                .id(section.getId())
                .title(section.getTitle())
                .description(section.getDescription())
                .orderIndex(section.getOrderIndex())
                .createdAt(section.getCreatedAt())
                .materials(section.getMaterials().stream()
                        .filter(m -> !Boolean.TRUE.equals(m.getIsHidden()))
                        .map(this::toMaterialDTO)
                        .toList())
                .build();
    }

    private WorkspaceMaterialDTO toMaterialDTO(WorkspaceMaterial material) {
        return WorkspaceMaterialDTO.builder()
                .id(material.getId())
                .title(material.getTitle())
                .fileUrl(material.getFileUrl())
                .fileType(material.getFileType())
                .originalFileName(material.getOriginalFileName())
                .isReference(material.getIsReference())
                .isHidden(material.getIsHidden())
                .uploadedAt(material.getUploadedAt())
                .build();
    }
}
