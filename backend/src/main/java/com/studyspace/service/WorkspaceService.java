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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceService {

    private final StudentWorkspaceRepository workspaceRepository;
    private final WorkspaceSpaceRepository spaceRepository;
    private final WorkspaceSectionRepository sectionRepository;
    private final WorkspaceMaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

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
        // Delete non-reference materials' files
        for (WorkspaceSpace space : workspace.getSpaces()) {
            for (WorkspaceSection section : space.getSections()) {
                for (WorkspaceMaterial material : section.getMaterials()) {
                    if (!Boolean.TRUE.equals(material.getIsReference())) {
                        fileStorageService.delete(material.getFileUrl());
                    }
                }
            }
        }
        workspaceRepository.delete(workspace);
    }

    @Transactional(readOnly = true)
    public List<StudentWorkspaceDTO> getMyWorkspaces(Long ownerId) {
        return workspaceRepository.findByOwnerId(ownerId)
                .stream().map(this::toWorkspaceDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<StudentWorkspaceDTO> getPublicWorkspaces(
            org.springframework.data.domain.Pageable pageable) {
        // All workspaces are returned; visibility filtering can be added when the
        // entity has a visibility field.
        return workspaceRepository.findAll(pageable).map(this::toWorkspaceDTO);
    }

    @Transactional(readOnly = true)
    public StudentWorkspaceDTO getWorkspaceById(Long workspaceId) {
        return toWorkspaceDTO(findWorkspace(workspaceId));
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
        return toSpaceDTO(spaceRepository.save(space));
    }

    @Transactional(readOnly = true)
    public List<WorkspaceSpaceDTO> getSpacesByWorkspace(Long workspaceId) {
        return spaceRepository.findByWorkspaceId(workspaceId)
                .stream().map(this::toSpaceDTO).collect(Collectors.toList());
    }

    /**
     * Fork (deep-copy) a course into a workspace space.
     * Materials are created as references (copy-on-write).
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

        // Deep-copy sections and materials
        for (CourseSection courseSection : course.getSections()) {
            WorkspaceSection wsSection = WorkspaceSection.builder()
                    .title(courseSection.getTitle())
                    .description(courseSection.getDescription())
                    .orderIndex(courseSection.getOrderIndex())
                    .space(space)
                    .build();
            wsSection = sectionRepository.save(wsSection);

            for (CourseMaterial courseMaterial : courseSection.getMaterials()) {
                WorkspaceMaterial wsMaterial = WorkspaceMaterial.builder()
                        .title(courseMaterial.getTitle())
                        .fileUrl(courseMaterial.getFileUrl())
                        .fileType(courseMaterial.getFileType())
                        .originalFileName(courseMaterial.getOriginalFileName())
                        .isReference(true) // Copy-on-write: initially just a reference
                        .section(wsSection)
                        .build();
                materialRepository.save(wsMaterial);
            }
        }

        return toSpaceDTO(spaceRepository.findById(space.getId()).orElseThrow());
    }

    public WorkspaceSpaceDTO updateSpace(Long spaceId, Long userId, CreateSpaceRequest request) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        space.setTitle(request.getTitle());
        space.setDescription(request.getDescription());
        return toSpaceDTO(spaceRepository.save(space));
    }

    public void deleteSpace(Long spaceId, Long userId) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        // Delete non-reference materials' files
        for (WorkspaceSection section : space.getSections()) {
            for (WorkspaceMaterial material : section.getMaterials()) {
                if (!Boolean.TRUE.equals(material.getIsReference())) {
                    fileStorageService.delete(material.getFileUrl());
                }
            }
        }
        spaceRepository.delete(space);
    }

    @Transactional(readOnly = true)
    public WorkspaceSpaceDTO getSpaceById(Long spaceId) {
        return toSpaceDTO(findSpace(spaceId));
    }

    // ─── Section CRUD ───────────────────────────────────────────────────────────

    public WorkspaceSectionDTO addSection(Long spaceId, Long userId, CreateWorkspaceSectionRequest request) {
        WorkspaceSpace space = findSpace(spaceId);
        assertOwner(space.getWorkspace(), userId);
        WorkspaceSection section = WorkspaceSection.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : space.getSections().size())
                .space(space)
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
        assertOwner(section.getSpace().getWorkspace(), userId);
        for (WorkspaceMaterial material : section.getMaterials()) {
            if (!Boolean.TRUE.equals(material.getIsReference())) {
                fileStorageService.delete(material.getFileUrl());
            }
        }
        sectionRepository.delete(section);
    }

    // ─── Material Upload ────────────────────────────────────────────────────────

    public WorkspaceMaterialDTO uploadMaterial(Long sectionId, Long userId,
                                                MultipartFile file, String title) {
        WorkspaceSection section = findSection(sectionId);
        assertOwner(section.getSpace().getWorkspace(), userId);

        String fileUrl = fileStorageService.store(file, "workspaces");
        MaterialType fileType = detectFileType(file.getOriginalFilename());

        WorkspaceMaterial material = WorkspaceMaterial.builder()
                .title(title)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .originalFileName(file.getOriginalFilename())
                .isReference(false) // Student's own upload
                .section(section)
                .build();
        return toMaterialDTO(materialRepository.save(material));
    }

    public void deleteMaterial(Long materialId, Long userId) {
        WorkspaceMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found: " + materialId));
        assertOwner(material.getSection().getSpace().getWorkspace(), userId);

        if (Boolean.TRUE.equals(material.getIsReference())) {
            // Soft-delete: keep the row so contribution_proposals FK stays intact,
            // but mark it hidden so it disappears from the student's view.
            material.setIsHidden(true);
            materialRepository.save(material);
        } else {
            // Hard-delete: student's own upload — safe to remove file + row.
            fileStorageService.delete(material.getFileUrl());
            materialRepository.delete(material);
        }
    }

    // ─── Helpers & Mappers ──────────────────────────────────────────────────────

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

    private void assertOwner(StudentWorkspace workspace, Long userId) {
        if (!workspace.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Forbidden: only the workspace owner can modify this.");
        }
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

    private WorkspaceSpaceDTO toSpaceDTO(WorkspaceSpace space) {
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
                .sections(space.getSections().stream().map(this::toSectionDTO).collect(Collectors.toList()))
                .build();
    }

    private WorkspaceSectionDTO toSectionDTO(WorkspaceSection section) {
        return WorkspaceSectionDTO.builder()
                .id(section.getId())
                .title(section.getTitle())
                .description(section.getDescription())
                .orderIndex(section.getOrderIndex())
                .createdAt(section.getCreatedAt())
                // Filter out soft-deleted reference materials from the student's view
                .materials(section.getMaterials().stream()
                        .filter(m -> !Boolean.TRUE.equals(m.getIsHidden()))
                        .map(this::toMaterialDTO)
                        .collect(Collectors.toList()))
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
