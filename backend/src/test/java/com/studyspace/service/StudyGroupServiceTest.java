package com.studyspace.service;

import com.studyspace.entity.StudyGroup;
import com.studyspace.entity.User;
import com.studyspace.repository.StudyGroupRepository;
import com.studyspace.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyGroupServiceTest {

    @Mock
    private StudyGroupRepository groupRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.studyspace.repository.StudySessionRepository sessionRepository;

    @Mock
    private com.studyspace.repository.SessionParticipantRepository participantRepository;

    @Mock
    private com.studyspace.mapper.UserMapper userMapper;

    @InjectMocks
    private StudyGroupService groupService;

    // ============== TRANSFER OWNERSHIP TESTS ==============

    @Test
    void transferOwnership_Success() {
        User originalOwner = new User();
        originalOwner.setId(1L);
        originalOwner.setUsername("original_owner");

        User newOwner = new User();
        newOwner.setId(2L);
        newOwner.setUsername("new_owner");

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setCreator(originalOwner);
        Set<User> members = new HashSet<>();
        members.add(originalOwner);
        members.add(newOwner);
        group.setMembers(members);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(newOwner));

        // Execute
        groupService.transferOwnership(10L, 2L);

        // Verify
        verify(groupRepository).save(argThat(g -> g.getCreator().equals(newOwner)));
    }

    @Test
    void transferOwnership_NewOwnerNotMember_Fails() {
        User originalOwner = new User();
        originalOwner.setId(1L);

        User nonMember = new User();
        nonMember.setId(99L);
        nonMember.setUsername("non_member");

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setCreator(originalOwner);
        Set<User> members = new HashSet<>();
        members.add(originalOwner); // Only original owner is member
        group.setMembers(members);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(99L)).thenReturn(Optional.of(nonMember));

        // Execute & Verify
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, 
            () -> groupService.transferOwnership(10L, 99L));
        
        assertEquals("New owner must be a member of the group", exception.getReason());
        verify(groupRepository, never()).save(any());
    }

    @Test
    void transferOwnership_GroupNotFound() {
        when(groupRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> groupService.transferOwnership(99L, 2L));
        verify(groupRepository, never()).save(any());
    }

    // ============== REMOVE MEMBER TESTS ==============

    @Test
    void removeMember_SelfRemoval_Success() {
        User creator = new User();
        creator.setId(1L);
        creator.setUsername("creator");
        creator.setGroups(new HashSet<>());

        User member = new User();
        member.setId(2L);
        member.setUsername("member");
        member.setGroups(new HashSet<>());

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setCreator(creator);
        Set<User> members = new HashSet<>();
        members.add(creator);
        members.add(member);
        group.setMembers(members);
        member.getGroups().add(group);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));

        // Execute - member removes themselves
        groupService.removeMember(10L, 2L, 2L);

        // Verify member was removed
        verify(groupRepository).save(argThat(g -> !g.getMembers().contains(member)));
    }

    @Test
    void removeMember_CreatorKicksMember_Success() {
        User creator = new User();
        creator.setId(1L);
        creator.setUsername("creator");
        creator.setGroups(new HashSet<>());

        User member = new User();
        member.setId(2L);
        member.setUsername("member");
        member.setGroups(new HashSet<>());

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setCreator(creator);
        Set<User> members = new HashSet<>();
        members.add(creator);
        members.add(member);
        group.setMembers(members);
        member.getGroups().add(group);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));

        // Execute - creator kicks member
        groupService.removeMember(10L, 2L, 1L);

        // Verify member was removed
        verify(groupRepository).save(argThat(g -> !g.getMembers().contains(member)));
    }

    @Test
    void removeMember_NonCreatorKicksOther_Fails() {
        User creator = new User();
        creator.setId(1L);
        creator.setUsername("creator");

        User member1 = new User();
        member1.setId(2L);
        member1.setUsername("member1");

        User member2 = new User();
        member2.setId(3L);
        member2.setUsername("member2");

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setCreator(creator);
        Set<User> members = new HashSet<>();
        members.add(creator);
        members.add(member1);
        members.add(member2);
        group.setMembers(members);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(3L)).thenReturn(Optional.of(member2));

        // Execute - member1 tries to kick member2 (not allowed)
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> groupService.removeMember(10L, 3L, 2L));
        
        assertEquals("Not authorized to remove this member", exception.getReason());
        verify(groupRepository, never()).save(any());
    }

    @Test
    void removeMember_CannotKickCreator() {
        User creator = new User();
        creator.setId(1L);
        creator.setUsername("creator");

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setCreator(creator);
        Set<User> members = new HashSet<>();
        members.add(creator);
        group.setMembers(members);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));

        // Execute - creator tries to kick themselves (edge case)
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> groupService.removeMember(10L, 1L, 1L));
        
        assertEquals("Cannot kick the group creator", exception.getReason());
        verify(groupRepository, never()).save(any());
    }

    // ============== CREATE / ADD MEMBER TESTS ==============

    @Test
    void createGroup_Success() {
        com.studyspace.dto.CreateGroupRequest req = new com.studyspace.dto.CreateGroupRequest();
        req.setName("New Group");
        req.setDescription("Desc");
        req.setGroupType(com.studyspace.types.GroupType.PUBLIC);

        User creator = new User();
        creator.setId(1L);
        creator.setGroups(new HashSet<>());

        when(userRepository.findById(1L)).thenReturn(Optional.of(creator));
        
        StudyGroup savedGroup = new StudyGroup();
        savedGroup.setId(50L);
        savedGroup.setName("New Group");
        savedGroup.setCreator(creator);
        savedGroup.setMembers(new HashSet<>(java.util.List.of(creator)));

        when(groupRepository.save(any(StudyGroup.class))).thenReturn(savedGroup);

        com.studyspace.dto.StudyGroupDTO dto = groupService.createGroup(1L, req);

        assertEquals(50L, dto.getId());
        assertEquals("New Group", dto.getName());
        verify(groupRepository).save(any(StudyGroup.class));
    }

    @Test
    void addMember_Success() {
        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setMembers(new HashSet<>());

        User user = new User();
        user.setId(2L);
        user.setGroups(new HashSet<>());

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));

        groupService.addMember(10L, 2L);

        assertTrue(group.getMembers().contains(user));
        assertTrue(user.getGroups().contains(group));
        verify(groupRepository).save(group);
    }

    @Test
    void addMember_GroupNotFound_ThrowsException() {
        when(groupRepository.findById(99L)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> groupService.addMember(99L, 2L));
        verify(userRepository, never()).findById(any());
        verify(groupRepository, never()).save(any());
    }

    @Test
    void createGroup_UserNotFound_ThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        com.studyspace.dto.CreateGroupRequest req = new com.studyspace.dto.CreateGroupRequest();
        
        assertThrows(RuntimeException.class, () -> groupService.createGroup(99L, req));
        verify(groupRepository, never()).save(any());
    }

    // ============== GET DETAILS TESTS ==============

    @Test
    void getGroupDetails_FiltersSessionsProperly() {
        StudyGroup group = new StudyGroup();
        group.setId(10L);
        User creator = new User();
        creator.setId(1L);
        group.setCreator(creator);
        group.setMembers(new HashSet<>(java.util.List.of(creator)));

        com.studyspace.entity.StudySession publicSession = new com.studyspace.entity.StudySession();
        publicSession.setId(100L);
        publicSession.setVisibility(com.studyspace.types.SessionVisibility.PUBLIC);
        publicSession.setCreator(creator);
        publicSession.setParticipants(new java.util.HashSet<>());

        com.studyspace.entity.StudySession privateSession = new com.studyspace.entity.StudySession();
        privateSession.setId(101L);
        privateSession.setVisibility(com.studyspace.types.SessionVisibility.PRIVATE);
        privateSession.setCreator(creator);
        privateSession.setParticipants(new java.util.HashSet<>());

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(sessionRepository.findByStudyGroupId(10L)).thenReturn(java.util.List.of(publicSession, privateSession));

        // Request as creator (should see both)
        com.studyspace.dto.StudyGroupDetailsDTO detailsAsCreator = groupService.getGroupDetails(10L, 1L);
        assertEquals(2, detailsAsCreator.getSessions().size());

        // Request as other user (should see only public)
        com.studyspace.dto.StudyGroupDetailsDTO detailsAsOther = groupService.getGroupDetails(10L, 99L);
        assertEquals(1, detailsAsOther.getSessions().size());
        assertEquals(100L, detailsAsOther.getSessions().get(0).getId());
    }

    @Test
    void getGroupDetails_NotFound_ThrowsException() {
        when(groupRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> groupService.getGroupDetails(99L, 1L));
    }

    @Test
    void getGroupByInviteCode_NotFound_ThrowsException() {
        when(groupRepository.findByInviteCode("INVALID")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> groupService.getGroupByInviteCode("INVALID"));
    }

    @Test
    void updateGroup_Success() {
        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setName("Old Name");
        User creator = new User();
        creator.setId(1L);
        group.setCreator(creator);

        com.studyspace.dto.CreateGroupRequest req = new com.studyspace.dto.CreateGroupRequest();
        req.setName("Updated Name");
        req.setDescription("Updated Desc");
        req.setGroupType(com.studyspace.types.GroupType.INVITE_ONLY);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(groupRepository.save(any(StudyGroup.class))).thenReturn(group);

        com.studyspace.dto.StudyGroupDTO dto = groupService.updateGroup(10L, req);

        assertEquals("Updated Name", group.getName());
        assertEquals("Updated Desc", group.getDescription());
        assertEquals(com.studyspace.types.GroupType.INVITE_ONLY, group.getGroupType());
        verify(groupRepository).save(group);
    }

    @Test
    void getAllGroups_ReturnsCorrectly() {
        StudyGroup group = new StudyGroup();
        group.setId(10L);
        User creator = new User();
        creator.setId(1L);
        group.setCreator(creator);
        group.setMembers(new HashSet<>());
        
        when(groupRepository.findAll()).thenReturn(java.util.List.of(group));
        org.mockito.Mockito.lenient().when(userMapper.toDTO(any(User.class))).thenReturn(new com.studyspace.dto.UserDTO());

        java.util.List<com.studyspace.dto.StudyGroupDTO> result = groupService.getAllGroups();
        assertEquals(1, result.size());
    }

    @Test
    void getGroupLeaderboard_ReturnsCorrectly() {
        User creator = new User(); creator.setId(1L);

        StudyGroup group1 = new StudyGroup(); group1.setId(10L); group1.setCreator(creator);
        StudyGroup group2 = new StudyGroup(); group2.setId(20L); group2.setCreator(creator);

        when(groupRepository.findAll()).thenReturn(java.util.List.of(group1, group2));
        when(groupRepository.findById(10L)).thenReturn(Optional.of(group1));
        when(groupRepository.findById(20L)).thenReturn(Optional.of(group2));

        // Stubbing stats calculation for group1
        com.studyspace.entity.StudySession session1 = new com.studyspace.entity.StudySession();
        session1.setId(100L);
        com.studyspace.entity.SessionParticipant p1 = new com.studyspace.entity.SessionParticipant();
        User u1 = new User(); u1.setId(1L); p1.setUser(u1); p1.setMinutesParticipated(100);
        when(sessionRepository.findByStudyGroupIdAndStartTimeAfter(eq(10L), any()))
            .thenReturn(java.util.List.of(session1));
        when(participantRepository.findByStudySessionId(100L)).thenReturn(java.util.List.of(p1));

        // Stubbing stats calculation for group2
        when(sessionRepository.findByStudyGroupIdAndStartTimeAfter(eq(20L), any()))
            .thenReturn(java.util.List.of());

        java.util.List<com.studyspace.dto.GroupStatsDTO> leaderboard = groupService.getGroupLeaderboard();
        
        assertEquals(2, leaderboard.size());
        assertEquals(10L, leaderboard.get(0).getGroupId()); // 100 minutes > 0 minutes
        assertEquals(20L, leaderboard.get(1).getGroupId());
    }

    // ============== DELETE GROUP TESTS ==============

    @Test
    void deleteGroup_PublicGroupWithActiveMembers_Fails() {
        User creator = new User();
        creator.setId(1L);

        User member = new User();
        member.setId(2L);

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setGroupType(com.studyspace.types.GroupType.PUBLIC);
        group.setCreator(creator);
        Set<User> members = new HashSet<>();
        members.add(creator);
        members.add(member); // Active member besides creator
        group.setMembers(members);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> groupService.deleteGroup(10L));
        
        assertTrue(exception.getReason().contains("Cannot delete a public group with active members"));
        verify(groupRepository, never()).delete(any());
    }

    @Test
    void deleteGroup_PublicGroupWithOnlyCreator_Success() {
        User creator = new User();
        creator.setId(1L);
        creator.setGroups(new HashSet<>());

        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setGroupType(com.studyspace.types.GroupType.PUBLIC);
        group.setCreator(creator);
        Set<User> members = new HashSet<>();
        members.add(creator); // Only creator
        group.setMembers(members);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));

        groupService.deleteGroup(10L);

        verify(groupRepository).delete(group);
    }

    // ============== GET STATS TESTS ==============

    @Test
    void getGroupStats_CalculatesCorrectly() {
        StudyGroup group = new StudyGroup();
        group.setId(10L);
        group.setName("Test Group");

        com.studyspace.entity.StudySession session1 = new com.studyspace.entity.StudySession();
        session1.setId(100L);
        com.studyspace.entity.StudySession session2 = new com.studyspace.entity.StudySession();
        session2.setId(200L);

        User user1 = new User(); user1.setId(1L);
        User user2 = new User(); user2.setId(2L);

        com.studyspace.entity.SessionParticipant p1 = new com.studyspace.entity.SessionParticipant();
        p1.setUser(user1);
        p1.setMinutesParticipated(30);

        com.studyspace.entity.SessionParticipant p2 = new com.studyspace.entity.SessionParticipant();
        p2.setUser(user2);
        p2.setMinutesParticipated(45);

        when(groupRepository.findById(10L)).thenReturn(Optional.of(group));
        when(sessionRepository.findByStudyGroupIdAndStartTimeAfter(eq(10L), any()))
                .thenReturn(java.util.List.of(session1, session2));
        
        when(participantRepository.findByStudySessionId(100L)).thenReturn(java.util.List.of(p1));
        when(participantRepository.findByStudySessionId(200L)).thenReturn(java.util.List.of(p2));

        com.studyspace.dto.GroupStatsDTO stats = groupService.getGroupStats(10L, java.time.LocalDateTime.now().minusDays(1), 0);

        assertEquals(10L, stats.getGroupId());
        assertEquals("Test Group", stats.getGroupName());
        assertEquals(2L, stats.getSessionCount());
        assertEquals(75L, stats.getTotalStudyMinutes());
        assertEquals(37.5, stats.getAverageSessionDuration());
        assertEquals(2L, stats.getActiveMemberCount());
    }
}
