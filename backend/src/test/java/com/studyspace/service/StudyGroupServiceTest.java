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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyGroupServiceTest {

    @Mock
    private StudyGroupRepository groupRepository;

    @Mock
    private UserRepository userRepository;

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
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> groupService.transferOwnership(10L, 99L));
        
        assertEquals("New owner must be a member of the group", exception.getMessage());
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
        RuntimeException exception = assertThrows(RuntimeException.class,
            () -> groupService.removeMember(10L, 3L, 2L));
        
        assertEquals("Not authorized to remove this member", exception.getMessage());
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
        RuntimeException exception = assertThrows(RuntimeException.class,
            () -> groupService.removeMember(10L, 1L, 1L));
        
        assertEquals("Cannot kick the group creator", exception.getMessage());
        verify(groupRepository, never()).save(any());
    }
}
