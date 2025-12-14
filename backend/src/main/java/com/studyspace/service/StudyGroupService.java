package com.studyspace.service;

import com.studyspace.dto.CreateGroupRequest;
import com.studyspace.dto.GroupStatsDTO;
import com.studyspace.dto.StudyGroupDTO;
import com.studyspace.entity.StudyGroup;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.StudyGroupRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudyGroupService {
    
    private final StudyGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final StudySessionRepository sessionRepository;
    
    public StudyGroupDTO createGroup(Long creatorId, CreateGroupRequest request) {
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        StudyGroup group = StudyGroup.builder()
            .name(request.getName())
            .description(request.getDescription())
            .creator(creator)
            .isPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false)
            .inviteCode(generateInviteCode())
            .build();
        
        // Add creator as member
        group.getMembers().add(creator);
        creator.getGroups().add(group);
        
        StudyGroup savedGroup = groupRepository.save(group);
        return convertToDTO(savedGroup);
    }
    
    @Transactional(readOnly = true)
    public StudyGroupDTO getGroupById(Long id) {
        StudyGroup group = groupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        return convertToDTO(group);
    }
    
    @Transactional(readOnly = true)
    public StudyGroupDTO getGroupByInviteCode(String inviteCode) {
        StudyGroup group = groupRepository.findByInviteCode(inviteCode)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        return convertToDTO(group);
    }
    
    @Transactional(readOnly = true)
    public List<StudyGroupDTO> getUserGroups(Long userId) {
        return groupRepository.findByMembersId(userId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<StudyGroupDTO> getCreatedGroups(Long userId) {
        return groupRepository.findByCreatorId(userId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public void addMember(Long groupId, Long userId) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!group.getMembers().contains(user)) {
            group.getMembers().add(user);
            user.getGroups().add(group);
            groupRepository.save(group);
        }
    }
    
    public void removeMember(Long groupId, Long userId) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        group.getMembers().remove(user);
        user.getGroups().remove(group);
        groupRepository.save(group);
    }
    
    @Transactional(readOnly = true)
    public GroupStatsDTO getGroupStats(Long groupId, LocalDateTime cutoffDate, Integer minimumMinutes) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Get all sessions for group members since cutoff date
        Set<Long> memberIds = group.getMembers().stream()
            .map(User::getId)
            .collect(Collectors.toSet());
        
        long sessionCount = 0;
        long totalStudyMinutes = 0;
        Set<Long> activeMemberIds = new HashSet<>();
        
        for (User member : group.getMembers()) {
            List<StudySession> userSessions = sessionRepository
                .findByCreatorIdAndStartTimeAfter(member.getId(), cutoffDate);
            sessionCount += userSessions.size();
            
            for (StudySession session : userSessions) {
                Integer durationMinutes = session.getDurationMinutes();
                if (durationMinutes != null) {
                    totalStudyMinutes += durationMinutes;
                    activeMemberIds.add(member.getId());
                }
            }
        }
        
        Double averageSessionDuration = sessionCount > 0 ? (double) totalStudyMinutes / sessionCount : 0.0;
        
        return GroupStatsDTO.builder()
            .groupId(group.getId())
            .groupName(group.getName())
            .sessionCount(sessionCount)
            .totalStudyMinutes(totalStudyMinutes)
            .averageSessionDuration(averageSessionDuration)
            .activeMemberCount((long) activeMemberIds.size())
            .build();
    }

    @Transactional(readOnly = true)
    public List<GroupStatsDTO> getGroupLeaderboard() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        return groupRepository.findAll().stream()
            .map(group -> getGroupStats(group.getId(), cutoffDate, 0))
            .sorted((g1, g2) -> Long.compare(g2.getTotalStudyMinutes(), g1.getTotalStudyMinutes()))
            .limit(10)
            .collect(Collectors.toList());
    }
    
    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private StudyGroupDTO convertToDTO(StudyGroup group) {
        return StudyGroupDTO.builder()
            .id(group.getId())
            .name(group.getName())
            .description(group.getDescription())
            .inviteCode(group.getInviteCode())
            .isPrivate(group.getIsPrivate())
            .createdAt(group.getCreatedAt())
            .updatedAt(group.getUpdatedAt())
            .creatorId(group.getCreator().getId())
            .memberCount(group.getMembers().size())
            .build();
    }
}
