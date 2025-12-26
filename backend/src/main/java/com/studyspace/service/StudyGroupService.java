package com.studyspace.service;

import com.studyspace.dto.CreateGroupRequest;
import com.studyspace.dto.GroupMemberStatsDTO;
import com.studyspace.dto.GroupStatsDTO;
import com.studyspace.dto.StudyGroupDTO;
import com.studyspace.entity.StudyGroup;
import com.studyspace.entity.StudySession;
import com.studyspace.entity.User;
import com.studyspace.repository.SessionParticipantRepository;
import com.studyspace.repository.StudyGroupRepository;
import com.studyspace.repository.StudySessionRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.types.GroupType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class StudyGroupService {
    
    private final StudyGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final StudySessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final com.studyspace.mapper.UserMapper userMapper;
    
    public StudyGroupDTO createGroup(Long creatorId, CreateGroupRequest request) {
        log.info("Creating group '{}' for user ID: {}", request.getName(), creatorId);
        User creator = userRepository.findById(creatorId)
            .orElseThrow(() -> {
                log.error("Failed to create group - user not found: {}", creatorId);
                return new RuntimeException("User not found");
            });
        
        StudyGroup group = StudyGroup.builder()
            .name(request.getName())
            .description(request.getDescription())
            .creator(creator)
            .groupType(request.getGroupType() != null ? request.getGroupType() : GroupType.PUBLIC)
            .inviteCode(generateInviteCode())
            .build();
        
        // Add creator as member
        group.getMembers().add(creator);
        creator.getGroups().add(group);
        
        StudyGroup savedGroup = groupRepository.save(group);
        log.info("Group created successfully - ID: {}, Name: '{}', Creator: {}", savedGroup.getId(), savedGroup.getName(), creator.getEmail());
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

    @Transactional(readOnly = true)
    public List<StudyGroupDTO> getAllGroups() {
        return groupRepository.findAll().stream()
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
    
    public void removeMember(Long groupId, Long userId, Long requesterId) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        User userToRemove = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (requesterId != null) {
             boolean isSelfRemoval = requesterId.equals(userId);
             boolean isAdminRemoval = group.getCreator().getId().equals(requesterId);
        
             if (!isSelfRemoval && !isAdminRemoval) {
                 throw new RuntimeException("Not authorized to remove this member");
             }
             if (isAdminRemoval && group.getCreator().getId().equals(userId)) {
                 throw new RuntimeException("Cannot kick the group creator");
             }
        }
        
        group.getMembers().remove(userToRemove);
        userToRemove.getGroups().remove(group);
        groupRepository.save(group);
    }
    
    public StudyGroupDTO updateGroup(Long groupId, CreateGroupRequest request) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
            
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        if (request.getGroupType() != null) {
            group.setGroupType(request.getGroupType());
        }
        
        return convertToDTO(groupRepository.save(group));
    }
    
    public void transferOwnership(Long groupId, Long newOwnerId) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
            
        User newOwner = userRepository.findById(newOwnerId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        // Check if new owner is a member
        if (!group.getMembers().contains(newOwner)) {
            throw new RuntimeException("New owner must be a member of the group");
        }
        
        group.setCreator(newOwner);
        groupRepository.save(group);
    }

    public void deleteGroup(Long groupId) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
            
        if (group.getGroupType() == GroupType.PUBLIC) {
            // Public group: cannot delete if there are other members (excluding creator if they are leaving, but here we are deleting)
            // Rule: "Group will be only deleted if the last user wants to leave (meaning the group will become empty)"
            if (group.getMembers().size() > 1) {
                throw new RuntimeException("Cannot delete a public group with active members. Please transfer ownership or wait until it is empty.");
            }
        } else if (group.getGroupType() == GroupType.INVITE_ONLY) {
             // Join-via-id: Creator offered options, but API just deletes.
             // We allow delete, but frontend should have warned/offered transfer.
        }
        // Personal group: Deleted if creator leaves (so delete is fine).

        // Remove group from all members
        for (User member : group.getMembers()) {
            member.getGroups().remove(group);
            userRepository.save(member);
        }
        group.getMembers().clear();
        
        groupRepository.delete(group);
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
    
    /**
     * Get group member leaderboard using the complex JPQL query.
     * This query joins 4 tables: User, SessionParticipant, StudySession, StudyGroup
     * and uses GROUP BY, HAVING, and ORDER BY.
     * 
     * @param groupId The group to get leaderboard for
     * @param since Only include sessions after this date
     * @param minMinutes Minimum minutes threshold
     * @return List of GroupMemberStatsDTO sorted by total study minutes
     */
    @Transactional(readOnly = true)
    public List<GroupMemberStatsDTO> getGroupMemberLeaderboard(Long groupId, LocalDateTime since, Integer minMinutes) {
        // Validate group exists
        groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Use the complex JPQL query
        return participantRepository.findGroupMemberStatsByGroupId(groupId, since, minMinutes);
    }
    
    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private StudyGroupDTO convertToDTO(StudyGroup group) {
        // Calculate active members (members with sessions in the last 7 days)
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        int activeMemberCount = (int) group.getMembers().stream()
            .filter(member -> {
                // Check if member has participated in any session in the last 7 days
                return participantRepository.findByUserId(member.getId()).stream()
                    .anyMatch(participant -> 
                        participant.getJoinedAt() != null && 
                        participant.getJoinedAt().isAfter(oneWeekAgo)
                    );
            })
            .count();
        
        // Calculate total sessions count for this group
        int totalSessionsCount = sessionRepository.findByStudyGroupId(group.getId()).size();
        
        return StudyGroupDTO.builder()
            .id(group.getId())
            .name(group.getName())
            .description(group.getDescription())
            .inviteCode(group.getInviteCode())
            .groupType(group.getGroupType())
            .createdAt(group.getCreatedAt())
            .updatedAt(group.getUpdatedAt())
            .creatorId(group.getCreator().getId())
            .memberCount(group.getMembers().size())
            .activeMemberCount(activeMemberCount)
            .totalSessionsCount(totalSessionsCount)
            .build();
    }
    @Transactional(readOnly = true)
    public com.studyspace.dto.StudyGroupDetailsDTO getGroupDetails(Long groupId, Long requestingUserId) {
        StudyGroup group = groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        
        List<StudySession> sessions = sessionRepository.findByStudyGroupId(groupId);
   
        List<com.studyspace.dto.StudySessionDTO> sessionDTOs = sessions.stream()
             .filter(s -> {
                 if (com.studyspace.types.SessionVisibility.PUBLIC.equals(s.getVisibility())) {
                     return true;
                 }
                 if (com.studyspace.types.SessionVisibility.PRIVATE.equals(s.getVisibility())) {
                     return requestingUserId != null && s.getCreator().getId().equals(requestingUserId);
                 }
                 return false;
             })
             .map(session -> {
                 return convertSessionToDTO(session);
             })
             .collect(Collectors.toList());

        // Map members
        List<com.studyspace.dto.GroupMemberDTO> memberDTOs = group.getMembers().stream()
            .map(member -> com.studyspace.dto.GroupMemberDTO.builder()
                .id(member.getId())
                .username(member.getUsername())
                .fullName(member.getFullName())
                .profilePictureUrl(member.getProfilePictureUrl())
                .currentStatus(member.getCurrentStatus())
                .isAdmin(member.getId().equals(group.getCreator().getId()))
                .joinedAt(null) // joinedAt not in User-Group relation directly available here easily without join query
                .totalStudyMinutesInGroup(0L) // Expensive to calc on the fly without dedicated query
                .build())
            .collect(Collectors.toList());

        return com.studyspace.dto.StudyGroupDetailsDTO.builder()
            .group(convertToDTO(group))
            .sessions(sessionDTOs)
            .members(memberDTOs)
            .build();
    }

    private com.studyspace.dto.StudySessionDTO convertSessionToDTO(StudySession session) {
        return com.studyspace.dto.StudySessionDTO.builder()
            .id(session.getId())
            .title(session.getTitle())
            .description(session.getDescription())
            .subject(session.getSubject())
            .startTime(session.getStartTime())
            .endTime(session.getEndTime())
            .durationMinutes(session.getDurationMinutes())
            .isGroupSession(session.getIsGroupSession())
            .roomCode(session.getRoomCode())
            .status(session.getStatus())
            .visibility(session.getVisibility())
            .createdAt(session.getCreatedAt())
            .creatorId(session.getCreator().getId())
            .creator(userMapper.toDTO(session.getCreator()))
            .studyGroupId(session.getStudyGroup() != null ? session.getStudyGroup().getId() : null)
            .participantCount(session.getParticipants().size())
            .duration("60m") // Placeholder or calc
            .build();
    }
}
