package com.studyspace.service;

import com.studyspace.dto.*;
import com.studyspace.entity.*;
import com.studyspace.repository.*;
import com.studyspace.types.ProposalStatus;
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
class ContributionServiceTest {

    @Mock private ContributionProposalRepository proposalRepository;
    @Mock private WorkspaceMaterialRepository workspaceMaterialRepository;
    @Mock private CourseSectionRepository courseSectionRepository;
    @Mock private CourseMaterialRepository courseMaterialRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private ContributionService contributionService;

    private User student;
    private User instructor;
    private Course course;
    private CourseSection section;
    private WorkspaceMaterial wsMaterial;

    @BeforeEach
    void setUp() {
        instructor = User.builder().id(1L).fullName("Prof Smith").build();
        student = User.builder().id(2L).fullName("Alice").build();
        course = Course.builder()
                .id(10L)
                .title("DS")
                .instructor(instructor)
                .sections(new ArrayList<>())
                .build();
        section = CourseSection.builder()
                .id(20L)
                .title("Week 1")
                .course(course)
                .materials(new ArrayList<>())
                .build();
        wsMaterial = WorkspaceMaterial.builder()
                .id(30L)
                .title("My Notes")
                .fileUrl("uploads/notes.pdf")
                .isReference(false)
                .build();
    }

    // ─── submitProposals ──────────────────────────────────────────────────────────

    @Test
    void submitProposals_ToExistingSection_Success() {
        SubmitProposalRequest request = new SubmitProposalRequest();
        request.setTargetCourseId(10L);
        request.setTargetSectionId(20L);
        request.setSourceMaterialIds(List.of(30L));
        request.setMessage("Please add this");

        ContributionProposal savedProposal = ContributionProposal.builder()
                .id(1L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .targetSection(section)
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(courseSectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(workspaceMaterialRepository.findById(30L)).thenReturn(Optional.of(wsMaterial));
        when(proposalRepository.existsBySourceMaterialIdAndStatus(30L, ProposalStatus.PENDING)).thenReturn(false);
        when(proposalRepository.save(any(ContributionProposal.class))).thenReturn(savedProposal);

        List<ContributionProposalDTO> results = contributionService.submitProposals(2L, request);

        assertEquals(1, results.size());
        assertEquals(ProposalStatus.PENDING, results.get(0).getStatus());
    }

    @Test
    void submitProposals_WithProposedNewSection_Success() {
        SubmitProposalRequest request = new SubmitProposalRequest();
        request.setTargetCourseId(10L);
        request.setProposedSectionTitle("New Chapter");
        request.setSourceMaterialIds(List.of(30L));

        ContributionProposal savedProposal = ContributionProposal.builder()
                .id(2L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .proposedSectionTitle("New Chapter")
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(workspaceMaterialRepository.findById(30L)).thenReturn(Optional.of(wsMaterial));
        when(proposalRepository.existsBySourceMaterialIdAndStatus(30L, ProposalStatus.PENDING)).thenReturn(false);
        when(proposalRepository.save(any(ContributionProposal.class))).thenReturn(savedProposal);

        List<ContributionProposalDTO> results = contributionService.submitProposals(2L, request);

        assertEquals(1, results.size());
        assertEquals("New Chapter", results.get(0).getProposedSectionTitle());
    }

    @Test
    void submitProposals_NoSectionOrTitle_ThrowsException() {
        SubmitProposalRequest request = new SubmitProposalRequest();
        request.setTargetCourseId(10L);
        request.setSourceMaterialIds(List.of(30L));
        // Neither targetSectionId nor proposedSectionTitle provided

        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThrows(RuntimeException.class, () -> contributionService.submitProposals(2L, request));
    }

    @Test
    void submitProposals_SkipsDuplicatePendingMaterial() {
        SubmitProposalRequest request = new SubmitProposalRequest();
        request.setTargetCourseId(10L);
        request.setTargetSectionId(20L);
        request.setSourceMaterialIds(List.of(30L));

        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(courseSectionRepository.findById(20L)).thenReturn(Optional.of(section));
        when(workspaceMaterialRepository.findById(30L)).thenReturn(Optional.of(wsMaterial));
        when(proposalRepository.existsBySourceMaterialIdAndStatus(30L, ProposalStatus.PENDING)).thenReturn(true);

        List<ContributionProposalDTO> results = contributionService.submitProposals(2L, request);

        // Already pending — proposal should be skipped
        assertTrue(results.isEmpty());
        verify(proposalRepository, never()).save(any());
    }

    // ─── reviewProposal — approve ─────────────────────────────────────────────

    @Test
    void reviewProposal_Approve_CopiesFileAndCreatesMaterial() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(100L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .targetSection(section)
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        ReviewProposalRequest request = new ReviewProposalRequest();
        request.setStatus(ProposalStatus.APPROVED);
        request.setReviewMessage("Great work!");

        CourseMaterial savedCourseMaterial = CourseMaterial.builder()
                .id(50L)
                .title("My Notes")
                .section(section)
                .build();

        ContributionProposal savedProposal = ContributionProposal.builder()
                .id(100L)
                .status(ProposalStatus.APPROVED)
                .student(student)
                .targetCourse(course)
                .targetSection(section)
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        when(proposalRepository.findById(100L)).thenReturn(Optional.of(proposal));
        when(fileStorageService.copy("uploads/notes.pdf", "courses")).thenReturn("courses/notes.pdf");
        when(courseMaterialRepository.save(any(CourseMaterial.class))).thenReturn(savedCourseMaterial);
        when(proposalRepository.save(any(ContributionProposal.class))).thenReturn(savedProposal);

        ContributionProposalDTO result = contributionService.reviewProposal(100L, 1L, request);

        assertNotNull(result);
        assertEquals(ProposalStatus.APPROVED, result.getStatus());
        verify(fileStorageService).copy("uploads/notes.pdf", "courses");
        verify(courseMaterialRepository).save(any(CourseMaterial.class));
    }

    @Test
    void reviewProposal_Reject_DoesNotCopyFile() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(101L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .targetSection(section)
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        ReviewProposalRequest request = new ReviewProposalRequest();
        request.setStatus(ProposalStatus.REJECTED);
        request.setReviewMessage("Not relevant");

        ContributionProposal savedProposal = ContributionProposal.builder()
                .id(101L).status(ProposalStatus.REJECTED).student(student).targetCourse(course)
                .targetSection(section).sourceMaterial(wsMaterial).contributorDisplayName("Alice").build();

        when(proposalRepository.findById(101L)).thenReturn(Optional.of(proposal));
        when(proposalRepository.save(any(ContributionProposal.class))).thenReturn(savedProposal);

        ContributionProposalDTO result = contributionService.reviewProposal(101L, 1L, request);

        assertEquals(ProposalStatus.REJECTED, result.getStatus());
        verify(fileStorageService, never()).copy(any(), any());
        verify(courseMaterialRepository, never()).save(any());
    }

    @Test
    void reviewProposal_Approve_CreatesNewSection() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(101L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .targetSection(null) // No existing section
                .proposedSectionTitle("Proposed Section") // Wants a new section
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        ReviewProposalRequest request = new ReviewProposalRequest();
        request.setStatus(ProposalStatus.APPROVED);

        CourseSection newSection = CourseSection.builder().id(50L).title("Proposed Section").course(course).build();
        CourseMaterial savedCourseMaterial = CourseMaterial.builder().id(50L).title("My Notes").section(newSection).build();
        ContributionProposal savedProposal = ContributionProposal.builder().id(101L).status(ProposalStatus.APPROVED).student(student).targetCourse(course).targetSection(newSection).sourceMaterial(wsMaterial).contributorDisplayName("Alice").build();

        when(proposalRepository.findById(101L)).thenReturn(Optional.of(proposal));
        when(courseSectionRepository.save(any(CourseSection.class))).thenReturn(newSection);
        when(fileStorageService.copy("uploads/notes.pdf", "courses")).thenReturn("courses/notes.pdf");
        when(courseMaterialRepository.save(any(CourseMaterial.class))).thenReturn(savedCourseMaterial);
        when(proposalRepository.save(any(ContributionProposal.class))).thenReturn(savedProposal);

        ContributionProposalDTO result = contributionService.reviewProposal(101L, 1L, request);

        assertEquals(ProposalStatus.APPROVED, result.getStatus());
        verify(courseSectionRepository).save(any(CourseSection.class)); // New section created
        verify(courseMaterialRepository).save(any(CourseMaterial.class));
    }

    @Test
    void reviewProposal_Approve_NoSectionAvailable_ThrowsException() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(101L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .targetSection(null) // No existing section
                .proposedSectionTitle(null) // And no proposed section title
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        ReviewProposalRequest request = new ReviewProposalRequest();
        request.setStatus(ProposalStatus.APPROVED);

        when(proposalRepository.findById(101L)).thenReturn(Optional.of(proposal));

        assertThrows(RuntimeException.class, () -> contributionService.reviewProposal(101L, 1L, request));
    }


    @Test
    void reviewProposal_ForbiddenForNonInstructor_ThrowsException() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(102L)
                .status(ProposalStatus.PENDING)
                .student(student)
                .targetCourse(course)
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        when(proposalRepository.findById(102L)).thenReturn(Optional.of(proposal));

        assertThrows(RuntimeException.class,
                () -> contributionService.reviewProposal(102L, 999L, new ReviewProposalRequest()));
    }

    @Test
    void reviewProposal_AlreadyReviewed_ThrowsException() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(103L)
                .status(ProposalStatus.APPROVED) // Already reviewed
                .student(student)
                .targetCourse(course)
                .sourceMaterial(wsMaterial)
                .contributorDisplayName("Alice")
                .build();

        ReviewProposalRequest request = new ReviewProposalRequest();
        request.setStatus(ProposalStatus.REJECTED);

        when(proposalRepository.findById(103L)).thenReturn(Optional.of(proposal));

        assertThrows(RuntimeException.class,
                () -> contributionService.reviewProposal(103L, 1L, request));
    }

    // ─── query methods ─────────────────────────────────────────────────────────

    @Test
    void getProposalsByStudent_ReturnsList() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(200L).status(ProposalStatus.PENDING).student(student).targetCourse(course)
                .sourceMaterial(wsMaterial).contributorDisplayName("Alice").build();

        when(proposalRepository.findByStudentId(2L)).thenReturn(List.of(proposal));

        List<ContributionProposalDTO> result = contributionService.getProposalsByStudent(2L);

        assertEquals(1, result.size());
    }

    @Test
    void getProposalsForCourse_ForbiddenForNonInstructor_ThrowsException() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        assertThrows(RuntimeException.class,
                () -> contributionService.getProposalsForCourse(10L, 999L));
    }

    @Test
    void getProposalsForCourse_Success() {
        ContributionProposal proposal = ContributionProposal.builder()
                .id(201L).status(ProposalStatus.PENDING).student(student).targetCourse(course)
                .sourceMaterial(wsMaterial).contributorDisplayName("Alice").build();

        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(proposalRepository.findByTargetCourseId(10L)).thenReturn(List.of(proposal));

        List<ContributionProposalDTO> result = contributionService.getProposalsForCourse(10L, 1L);

        assertEquals(1, result.size());
    }

    @Test
    void getAcceptedContributions_ReturnsApprovedOnly() {
        ContributionProposal approved = ContributionProposal.builder()
                .id(300L).status(ProposalStatus.APPROVED).student(student).targetCourse(course)
                .targetSection(section).sourceMaterial(wsMaterial).contributorDisplayName("Alice").build();

        when(proposalRepository.findByTargetCourseIdAndStatus(10L, ProposalStatus.APPROVED))
                .thenReturn(List.of(approved));

        List<ContributionProposalDTO> result = contributionService.getAcceptedContributions(10L);

        assertEquals(1, result.size());
        assertEquals(ProposalStatus.APPROVED, result.get(0).getStatus());
    }
}
