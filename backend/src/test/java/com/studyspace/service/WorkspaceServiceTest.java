package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.MaterialType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock private StudentWorkspaceRepository workspaceRepository;
    @Mock private WorkspaceSpaceRepository spaceRepository;
    @Mock private WorkspaceSectionRepository sectionRepository;
    @Mock private WorkspaceMaterialRepository materialRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private ContributionProposalRepository proposalRepository;
    @Mock private SpaceGuestRepository guestRepository;

    @InjectMocks
    private WorkspaceService workspaceService;

    private User owner;
    private User other;
    private StudentWorkspace workspace;
    private WorkspaceSpace space;
    private WorkspaceSection section;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).fullName("Alice").build();
        other = User.builder().id(2L).fullName("Bob").build();

        workspace = StudentWorkspace.builder()
                .id(10L)
                .name("My Workspace")
                .description("A private workspace")
                .owner(owner)
                .spaces(new ArrayList<>())
                .build();

        space = WorkspaceSpace.builder()
                .id(20L)
                .title("DS Space")
                .workspace(workspace)
                .sections(new ArrayList<>())
                .build();

        section = WorkspaceSection.builder()
                .id(30L)
                .title("Lecture Notes")
                .space(space)
                .materials(new ArrayList<>())
                .build();
    }

    // ─── createWorkspace ────────────────────────────────────────────────────────

    @Test
    void createWorkspace_Success() {
        CreateWorkspaceRequest request = new CreateWorkspaceRequest();
        request.setName("My Workspace");
        request.setDescription("A private workspace");

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(workspaceRepository.save(any(StudentWorkspace.class))).thenReturn(workspace);

        StudentWorkspaceDTO result = workspaceService.createWorkspace(1L, request);

        assertNotNull(result);
        assertEquals("My Workspace", result.getName());
        verify(workspaceRepository).save(any(StudentWorkspace.class));
    }

    @Test
    void createWorkspace_OwnerNotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> workspaceService.createWorkspace(99L, new CreateWorkspaceRequest()));
    }

    // ─── updateWorkspace ────────────────────────────────────────────────────────

    @Test
    void updateWorkspace_Success() {
        CreateWorkspaceRequest request = new CreateWorkspaceRequest();
        request.setName("Updated Name");

        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));
        when(workspaceRepository.save(any(StudentWorkspace.class))).thenReturn(workspace);

        StudentWorkspaceDTO result = workspaceService.updateWorkspace(10L, 1L, request);

        assertNotNull(result);
        verify(workspaceRepository).save(workspace);
    }

    @Test
    void updateWorkspace_ForbiddenForNonOwner_ThrowsException() {
        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));

        assertThrows(RuntimeException.class,
                () -> workspaceService.updateWorkspace(10L, 2L, new CreateWorkspaceRequest()));
    }

    // ─── deleteWorkspace ────────────────────────────────────────────────────────

    @Test
    void deleteWorkspace_DeletesNonReferenceFiles() {
        WorkspaceMaterial nonRef = WorkspaceMaterial.builder()
                .id(100L).fileUrl("uploads/file.pdf").isReference(false).section(section).build();
        WorkspaceMaterial ref = WorkspaceMaterial.builder()
                .id(101L).fileUrl("courses/orig.pdf").isReference(true).section(section).build();

        section.getMaterials().addAll(List.of(nonRef, ref));
        space.getSections().add(section);
        workspace.getSpaces().add(space);

        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));

        workspaceService.deleteWorkspace(10L, 1L);

        // Only the non-reference file should be deleted from storage
        verify(fileStorageService).delete("uploads/file.pdf");
        verify(fileStorageService, never()).delete("courses/orig.pdf");
        verify(workspaceRepository).delete(workspace);
    }

    @Test
    void deleteWorkspace_ForbiddenForNonOwner_ThrowsException() {
        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));

        assertThrows(RuntimeException.class,
                () -> workspaceService.deleteWorkspace(10L, 2L));
    }

    // ─── createSpace ────────────────────────────────────────────────────────────

    @Test
    void createSpace_Success() {
        CreateSpaceRequest request = new CreateSpaceRequest();
        request.setTitle("DS Space");

        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));
        when(spaceRepository.save(any(WorkspaceSpace.class))).thenReturn(space);

        WorkspaceSpaceDTO result = workspaceService.createSpace(10L, 1L, request);

        assertNotNull(result);
        assertEquals("DS Space", result.getTitle());
    }

    @Test
    void createSpace_ForbiddenForNonOwner_ThrowsException() {
        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));

        assertThrows(RuntimeException.class,
                () -> workspaceService.createSpace(10L, 2L, new CreateSpaceRequest()));
    }

    // ─── addSection ─────────────────────────────────────────────────────────────

    @Test
    void addSection_Success() {
        CreateWorkspaceSectionRequest request = new CreateWorkspaceSectionRequest();
        request.setTitle("Lecture Notes");

        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(sectionRepository.save(any(WorkspaceSection.class))).thenReturn(section);

        WorkspaceSectionDTO result = workspaceService.addSection(20L, 1L, request);

        assertNotNull(result);
        assertEquals("Lecture Notes", result.getTitle());
    }

    // ─── deleteMaterial ─────────────────────────────────────────────────────────

    @Test
    void deleteMaterial_OwnUpload_DeletesFileAndRow() {
        WorkspaceMaterial nonRef = WorkspaceMaterial.builder()
                .id(50L)
                .fileUrl("uploads/notes.pdf")
                .isReference(false)
                .section(section)
                .build();

        when(materialRepository.findById(50L)).thenReturn(Optional.of(nonRef));

        workspaceService.deleteMaterial(50L, 1L);

        verify(fileStorageService).delete("uploads/notes.pdf");
        verify(materialRepository).delete(nonRef);
    }

    @Test
    void deleteMaterial_ReferenceFile_SoftDeletesRow() {
        WorkspaceMaterial refMaterial = WorkspaceMaterial.builder()
                .id(51L)
                .fileUrl("courses/orig.pdf")
                .isReference(true)
                .isHidden(false)
                .section(section)
                .build();

        when(materialRepository.findById(51L)).thenReturn(Optional.of(refMaterial));
        when(materialRepository.save(any(WorkspaceMaterial.class))).thenReturn(refMaterial);
        when(proposalRepository.existsBySourceMaterialId(51L)).thenReturn(true);

        workspaceService.deleteMaterial(51L, 1L);

        // Materials with proposals are soft-deleted: file NOT removed, row marked hidden
        verify(fileStorageService, never()).delete(any());
        assertTrue(refMaterial.getIsHidden());
        verify(materialRepository).save(refMaterial);
    }

    @Test
    void deleteMaterial_ForbiddenForNonOwner_ThrowsException() {
        WorkspaceMaterial material = WorkspaceMaterial.builder()
                .id(52L)
                .fileUrl("uploads/notes.pdf")
                .isReference(false)
                .section(section)
                .build();

        when(materialRepository.findById(52L)).thenReturn(Optional.of(material));

        // section.space.workspace.owner is user 1; user 2 must be rejected
        assertThrows(RuntimeException.class,
                () -> workspaceService.deleteMaterial(52L, 2L));
    }

    // ─── getMyWorkspaces ────────────────────────────────────────────────────────

    @Test
    void getMyWorkspaces_ReturnsList() {
        when(workspaceRepository.findByOwnerIdWithSearch(eq(1L), any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(workspace)));

        org.springframework.data.domain.Page<StudentWorkspaceDTO> result = workspaceService.getMyWorkspaces(1L, null, org.springframework.data.domain.PageRequest.of(0, 10));

        assertEquals(1, result.getContent().size());
        assertEquals("My Workspace", result.getContent().get(0).getName());
    }

    // ─── forkCourse ─────────────────────────────────────────────────────────────

    @Test
    void forkCourse_Success() {
        Course course = Course.builder().id(100L).title("Original Course").description("Desc").sections(new ArrayList<>()).build();
        CourseSection cSection = CourseSection.builder().id(101L).title("S1").course(course).materials(new ArrayList<>()).build();
        CourseMaterial cMaterial = CourseMaterial.builder().id(102L).title("M1").fileUrl("url").fileType(MaterialType.PDF).section(cSection).build();
        cSection.getMaterials().add(cMaterial);
        course.getSections().add(cSection);

        WorkspaceSpace forkedSpace = WorkspaceSpace.builder().id(300L).title("Custom Title").workspace(workspace).forkedFromCourse(course).sections(new ArrayList<>()).build();

        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));
        when(courseRepository.findById(100L)).thenReturn(Optional.of(course));
        when(spaceRepository.save(any(WorkspaceSpace.class))).thenReturn(forkedSpace);
        when(sectionRepository.save(any(WorkspaceSection.class))).thenAnswer(i -> {
            WorkspaceSection ws = i.getArgument(0);
            ws.setId(301L);
            return ws;
        });
        when(spaceRepository.findById(300L)).thenReturn(Optional.of(forkedSpace));

        WorkspaceSpaceDTO result = workspaceService.forkCourse(10L, 1L, 100L, "Custom Title");
        assertNotNull(result);
        assertEquals("Custom Title", result.getTitle());
        verify(materialRepository, times(1)).save(any(WorkspaceMaterial.class));
    }

    @Test
    void forkCourse_NullCustomTitle_UsesCourseTitle() {
        Course course = Course.builder().id(100L).title("Original Course").description("Desc").sections(new ArrayList<>()).build();
        WorkspaceSpace forkedSpace = WorkspaceSpace.builder().id(300L).title("Original Course").workspace(workspace).forkedFromCourse(course).sections(new ArrayList<>()).build();

        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));
        when(courseRepository.findById(100L)).thenReturn(Optional.of(course));
        when(spaceRepository.save(any(WorkspaceSpace.class))).thenReturn(forkedSpace);
        when(spaceRepository.findById(300L)).thenReturn(Optional.of(forkedSpace));

        WorkspaceSpaceDTO result = workspaceService.forkCourse(10L, 1L, 100L, null);
        assertNotNull(result);
        assertEquals("Original Course", result.getTitle());
    }

    // ─── deleteSpace ────────────────────────────────────────────────────────────

    @Test
    void deleteSpace_Success() {
        WorkspaceMaterial nonRef = WorkspaceMaterial.builder().id(50L).fileUrl("uploads/doc.pdf").isReference(false).section(section).build();
        section.getMaterials().add(nonRef);
        space.getSections().add(section);

        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));

        workspaceService.deleteSpace(20L, 1L);

        verify(fileStorageService).delete("uploads/doc.pdf");
        verify(spaceRepository).delete(space);
    }

    @Test
    void deleteSpace_ForbiddenForNonOwner_ThrowsException() {
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        assertThrows(RuntimeException.class, () -> workspaceService.deleteSpace(20L, 2L));
    }

    // ─── updateSection ──────────────────────────────────────────────────────────

    @Test
    void updateSection_Success() {
        CreateWorkspaceSectionRequest request = new CreateWorkspaceSectionRequest();
        request.setTitle("New Title");
        request.setDescription("New Desc");
        request.setOrderIndex(5);

        when(sectionRepository.findById(30L)).thenReturn(Optional.of(section));
        when(sectionRepository.save(any(WorkspaceSection.class))).thenReturn(section);

        WorkspaceSectionDTO result = workspaceService.updateSection(30L, 1L, request);

        assertNotNull(result);
        assertEquals("New Title", section.getTitle());
        assertEquals(5, section.getOrderIndex());
    }

    @Test
    void updateSection_Forbidden_ThrowsException() {
        when(sectionRepository.findById(30L)).thenReturn(Optional.of(section));
        assertThrows(RuntimeException.class, () -> workspaceService.updateSection(30L, 2L, new CreateWorkspaceSectionRequest()));
    }

    // ─── deleteSection ──────────────────────────────────────────────────────────

    @Test
    void deleteSection_Success() {
        WorkspaceMaterial nonRef = WorkspaceMaterial.builder().id(50L).fileUrl("uploads/doc.pdf").isReference(false).section(section).build();
        section.getMaterials().add(nonRef);

        when(sectionRepository.findById(30L)).thenReturn(Optional.of(section));

        workspaceService.deleteSection(30L, 1L);

        verify(fileStorageService).delete("uploads/doc.pdf");
        verify(sectionRepository).delete(section);
    }

    @Test
    void deleteSection_Forbidden_ThrowsException() {
        when(sectionRepository.findById(30L)).thenReturn(Optional.of(section));
        assertThrows(RuntimeException.class, () -> workspaceService.deleteSection(30L, 2L));
    }

    // ─── uploadMaterial (detectFileType) ────────────────────────────────────────

    @Test
    void uploadMaterial_DetectsAllFileTypes() {
        when(sectionRepository.findById(30L)).thenReturn(Optional.of(section));
        when(fileStorageService.store(any(), anyString())).thenReturn("url");
        when(materialRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);

        // PDF
        when(sectionRepository.findById(30L)).thenReturn(Optional.of(section));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(mockFile.getOriginalFilename()).thenReturn("test.pdf");
        WorkspaceMaterialDTO dto = workspaceService.uploadMaterial(30L, 1L, mockFile, "Title");
        assertEquals(MaterialType.PDF, dto.getFileType());

        // SLIDES
        when(mockFile.getOriginalFilename()).thenReturn("test.ppt");
        dto = workspaceService.uploadMaterial(30L, 1L, mockFile, "Title");
        assertEquals(MaterialType.SLIDES, dto.getFileType());

        // VIDEO
        when(mockFile.getOriginalFilename()).thenReturn("test.mp4");
        dto = workspaceService.uploadMaterial(30L, 1L, mockFile, "Title");
        assertEquals(MaterialType.VIDEO, dto.getFileType());

        // IMAGE
        when(mockFile.getOriginalFilename()).thenReturn("test.jpg");
        dto = workspaceService.uploadMaterial(30L, 1L, mockFile, "Title");
        assertEquals(MaterialType.IMAGE, dto.getFileType());

        // OTHER
        when(mockFile.getOriginalFilename()).thenReturn("test.txt");
        dto = workspaceService.uploadMaterial(30L, 1L, mockFile, "Title");
        assertEquals(MaterialType.OTHER, dto.getFileType());

        // Null filename
        when(mockFile.getOriginalFilename()).thenReturn(null);
        dto = workspaceService.uploadMaterial(30L, 1L, mockFile, "Title");
        assertEquals(MaterialType.OTHER, dto.getFileType());
    }

    // ─── Missing Workspace Tests ────────────────────────────────────────────────

    @Test
    void getPublicWorkspaces_ReturnsPage() {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        org.springframework.data.domain.Page<StudentWorkspace> page = new org.springframework.data.domain.PageImpl<>(List.of(workspace));
        when(workspaceRepository.findAll(pageable)).thenReturn(page);

        org.springframework.data.domain.Page<StudentWorkspaceDTO> result = workspaceService.getPublicWorkspaces(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("My Workspace", result.getContent().get(0).getName());
    }

    @Test
    void getWorkspaceById_Success() {
        when(workspaceRepository.findById(10L)).thenReturn(Optional.of(workspace));
        StudentWorkspaceDTO result = workspaceService.getWorkspaceById(10L);
        assertNotNull(result);
        assertEquals("My Workspace", result.getName());
    }

    // ─── Missing Space Tests ────────────────────────────────────────────────────

    @Test
    void getSpacesByWorkspace_ReturnsList() {
        space.setWorkspace(workspace);
        when(spaceRepository.findByWorkspaceIdWithSearch(eq(10L), any(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(space)));
        
        org.springframework.data.domain.Page<WorkspaceSpaceDTO> result = workspaceService.getSpacesByWorkspace(10L, null, org.springframework.data.domain.PageRequest.of(0, 10));
        assertEquals(1, result.getContent().size());
        assertEquals("DS Space", result.getContent().get(0).getTitle());
    }

    @Test
    void getSpaceById_AsOwner_Success() {
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        when(guestRepository.existsBySpaceIdAndUserId(20L, 1L)).thenReturn(false);
        
        WorkspaceSpaceDTO result = workspaceService.getSpaceById(20L, 1L);
        assertNotNull(result);
        assertEquals("DS Space", result.getTitle());
    }

    @Test
    void getSpaceById_AsGuest_Success() {
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        when(guestRepository.existsBySpaceIdAndUserId(20L, 2L)).thenReturn(true);
        
        WorkspaceSpaceDTO result = workspaceService.getSpaceById(20L, 2L);
        assertNotNull(result);
        assertEquals("DS Space", result.getTitle());
    }

    @Test
    void getSpaceById_Forbidden_ThrowsException() {
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        when(guestRepository.existsBySpaceIdAndUserId(20L, 3L)).thenReturn(false);
        
        assertThrows(IllegalStateException.class, () -> workspaceService.getSpaceById(20L, 3L));
    }

    // ─── Sharing Tests ──────────────────────────────────────────────────────────

    @Test
    void enableSharing_Success() {
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        
        ShareSettingsDTO result = workspaceService.enableSharing(20L, 1L);
        
        assertTrue(result.isSharingEnabled());
        assertNotNull(result.getInviteCode());
        verify(spaceRepository).save(space);
    }

    @Test
    void disableSharing_Success() {
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        
        workspaceService.disableSharing(20L, 1L);
        
        assertFalse(space.getSharingEnabled());
        verify(spaceRepository).save(space);
    }

    @Test
    void regenerateInviteCode_Success() {
        space.setInviteCode("OLD-CODE");
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        
        ShareSettingsDTO result = workspaceService.regenerateInviteCode(20L, 1L);
        
        assertTrue(result.isSharingEnabled());
        assertNotNull(result.getInviteCode());
        assertNotEquals("OLD-CODE", result.getInviteCode());
        verify(spaceRepository).save(space);
    }

    // ─── Guest Operations ───────────────────────────────────────────────────────

    @Test
    void joinByCode_Success() {
        space.setSharingEnabled(true);
        when(spaceRepository.findByInviteCode("SPACE-123")).thenReturn(Optional.of(space));
        when(guestRepository.existsBySpaceIdAndUserId(20L, 2L)).thenReturn(false);
        when(userRepository.findById(2L)).thenReturn(Optional.of(other));
        
        WorkspaceSpaceDTO result = workspaceService.joinByCode("SPACE-123", 2L);
        
        assertNotNull(result);
        verify(guestRepository).save(any(SpaceGuest.class));
    }

    @Test
    void joinByCode_AlreadyGuest() {
        space.setSharingEnabled(true);
        when(spaceRepository.findByInviteCode("SPACE-123")).thenReturn(Optional.of(space));
        when(guestRepository.existsBySpaceIdAndUserId(20L, 2L)).thenReturn(true);
        
        WorkspaceSpaceDTO result = workspaceService.joinByCode("SPACE-123", 2L);
        
        assertNotNull(result);
        verify(guestRepository, never()).save(any(SpaceGuest.class));
    }

    @Test
    void joinByCode_SharingDisabled_ThrowsException() {
        space.setSharingEnabled(false);
        when(spaceRepository.findByInviteCode("SPACE-123")).thenReturn(Optional.of(space));
        
        assertThrows(IllegalStateException.class, () -> workspaceService.joinByCode("SPACE-123", 2L));
    }

    @Test
    void joinByCode_AsOwner_ThrowsException() {
        space.setSharingEnabled(true);
        when(spaceRepository.findByInviteCode("SPACE-123")).thenReturn(Optional.of(space));
        
        assertThrows(IllegalStateException.class, () -> workspaceService.joinByCode("SPACE-123", 1L));
    }

    @Test
    void leaveSpace_Success() {
        SpaceGuest guest = SpaceGuest.builder().space(space).user(other).build();
        when(guestRepository.findBySpaceIdAndUserId(20L, 2L)).thenReturn(Optional.of(guest));
        
        workspaceService.leaveSpace(20L, 2L);
        
        verify(guestRepository).delete(guest);
    }

    @Test
    void getSharedSpaces_ReturnsList() {
        SpaceGuest guest = SpaceGuest.builder().space(space).user(other).build();
        when(guestRepository.findByUserId(eq(2L), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(guest)));
        
        org.springframework.data.domain.Page<WorkspaceSpaceDTO> result = workspaceService.getSharedSpaces(2L, org.springframework.data.domain.PageRequest.of(0, 10));
        
        assertEquals(1, result.getContent().size());
        assertEquals("DS Space", result.getContent().get(0).getTitle());
    }

    @Test
    void removeGuest_Success() {
        SpaceGuest guest = SpaceGuest.builder().space(space).user(other).build();
        when(spaceRepository.findById(20L)).thenReturn(Optional.of(space));
        when(guestRepository.findBySpaceIdAndUserId(20L, 2L)).thenReturn(Optional.of(guest));
        
        workspaceService.removeGuest(20L, 2L, 1L);
        
        verify(guestRepository).delete(guest);
    }
}
