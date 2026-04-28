package com.studyspace.controller;

import com.studyspace.dto.*;
import com.studyspace.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    // ─── Workspace Endpoints ────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<StudentWorkspaceDTO> createWorkspace(
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.createWorkspace(userId, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<StudentWorkspaceDTO>> getMyWorkspaces(@RequestParam Long userId) {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces(userId));
    }

    @GetMapping("/public")
    public ResponseEntity<org.springframework.data.domain.Page<StudentWorkspaceDTO>> getPublicWorkspaces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(workspaceService.getPublicWorkspaces(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentWorkspaceDTO> getWorkspace(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getWorkspaceById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentWorkspaceDTO> updateWorkspace(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceRequest request) {
        return ResponseEntity.ok(workspaceService.updateWorkspace(id, userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(
            @PathVariable Long id,
            @RequestParam Long userId) {
        workspaceService.deleteWorkspace(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Space Endpoints ────────────────────────────────────────────────────────

    @PostMapping("/{id}/spaces")
    public ResponseEntity<WorkspaceSpaceDTO> createSpace(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateSpaceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.createSpace(id, userId, request));
    }

    @GetMapping("/{id}/spaces")
    public ResponseEntity<List<WorkspaceSpaceDTO>> getSpaces(@PathVariable Long id) {
        return ResponseEntity.ok(workspaceService.getSpacesByWorkspace(id));
    }

    @PostMapping("/{id}/spaces/fork")
    public ResponseEntity<WorkspaceSpaceDTO> forkCourse(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam Long courseId,
            @RequestParam(required = false) String title) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.forkCourse(id, userId, courseId, title));
    }

    @GetMapping("/spaces/{spaceId}")
    public ResponseEntity<WorkspaceSpaceDTO> getSpace(@PathVariable Long spaceId) {
        return ResponseEntity.ok(workspaceService.getSpaceById(spaceId));
    }

    @PutMapping("/spaces/{spaceId}")
    public ResponseEntity<WorkspaceSpaceDTO> updateSpace(
            @PathVariable Long spaceId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateSpaceRequest request) {
        return ResponseEntity.ok(workspaceService.updateSpace(spaceId, userId, request));
    }

    @DeleteMapping("/spaces/{spaceId}")
    public ResponseEntity<Void> deleteSpace(
            @PathVariable Long spaceId,
            @RequestParam Long userId) {
        workspaceService.deleteSpace(spaceId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Section Endpoints ──────────────────────────────────────────────────────

    @PostMapping("/spaces/{spaceId}/sections")
    public ResponseEntity<WorkspaceSectionDTO> addSection(
            @PathVariable Long spaceId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceSectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.addSection(spaceId, userId, request));
    }

    @PutMapping("/sections/{sectionId}")
    public ResponseEntity<WorkspaceSectionDTO> updateSection(
            @PathVariable Long sectionId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceSectionRequest request) {
        return ResponseEntity.ok(workspaceService.updateSection(sectionId, userId, request));
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(
            @PathVariable Long sectionId,
            @RequestParam Long userId) {
        workspaceService.deleteSection(sectionId, userId);
        return ResponseEntity.noContent().build();
    }

    // ─── Material Endpoints ─────────────────────────────────────────────────────

    @PostMapping(value = "/sections/{sectionId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WorkspaceMaterialDTO> uploadMaterial(
            @PathVariable Long sectionId,
            @RequestParam Long userId,
            @RequestParam String title,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workspaceService.uploadMaterial(sectionId, userId, file, title));
    }

    @DeleteMapping("/materials/{materialId}")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long materialId,
            @RequestParam Long userId) {
        workspaceService.deleteMaterial(materialId, userId);
        return ResponseEntity.noContent().build();
    }
}
