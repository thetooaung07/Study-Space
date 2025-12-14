package com.studyspace.service;

import com.studyspace.dto.CreateSessionRequest;
import com.studyspace.dto.StudySessionDTO;
import com.studyspace.entity.*;
import com.studyspace.types.ActivityType;
import com.studyspace.types.SessionStatus;
import com.studyspace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StudySessionService {
    
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final SessionParticipantRepository participantRepository;
    private final ActivityRepository activityRepository;
    private final StudyGroupRepository groupRepository;
    
    public StudySessionDTO createSession(Long userId, CreateSessionRequest request) {
        User creator = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        StudySession session = StudySession.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .subject(request.getSubject())
            .creator(creator)
            .isGroupSession(request.getIsGroupSession() != null ? request.getIsGroupSession() : false)
            .status(SessionStatus.SCHEDULED)
            .build();
        
        if (request.getStudyGroupId() != null) {
            StudyGroup group = groupRepository.findById(request.getStudyGroupId())
                .orElseThrow(() -> new RuntimeException("Study group not found"));
            session.setStudyGroup(group);
            session.setIsGroupSession(true);
        }
        
        // Generate room code
        session.setRoomCode(generateRoomCode());
        
        StudySession savedSession = sessionRepository.save(session);
        return convertToDTO(savedSession);
    }
    
    @Transactional(readOnly = true)
    public StudySessionDTO getSessionById(Long id) {
        StudySession session = sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        return convertToDTO(session);
    }
    
    @Transactional(readOnly = true)
    public List<StudySessionDTO> getUserSessions(Long userId) {
        return sessionRepository.findByCreatorId(userId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudySessionDTO> getUserSessionHistory(Long userId) {
        return sessionRepository.findByCreatorId(userId).stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED)
                .sorted((s1, s2) -> s2.getEndTime().compareTo(s1.getEndTime()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public StudySessionDTO startSession(Long sessionId) {
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus(SessionStatus.ACTIVE);
        session.setStartTime(LocalDateTime.now());
        return convertToDTO(sessionRepository.save(session));
    }
    
    public StudySessionDTO endSession(Long sessionId) {
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        session.setEndTime(LocalDateTime.now());
        session.setStatus(SessionStatus.COMPLETED);
        
        // Calculate duration
        long durationMinutes = ChronoUnit.MINUTES.between(session.getStartTime(), session.getEndTime());
        session.setDurationMinutes((int) durationMinutes);
        
        // Update participants' minutes and user study times
        session.getParticipants().forEach(participant -> {
            LocalDateTime leftTime = participant.getLeftAt() != null ? participant.getLeftAt() : LocalDateTime.now();
            long participationMinutes = ChronoUnit.MINUTES.between(participant.getJoinedAt(), leftTime);
            participant.setMinutesParticipated((int) participationMinutes);
            
            User user = participant.getUser();
            user.setTotalStudyMinutes(user.getTotalStudyMinutes() + (int) participationMinutes);
            userRepository.save(user);
            participantRepository.save(participant);
        });
        
        // Create milestone activity
        Activity activity = Activity.builder()
            .type(ActivityType.MILESTONE_REACHED)
            .message("Session completed: " + (int) durationMinutes + " minutes")
            .studySession(session)
            .user(session.getCreator())
            .build();
        activityRepository.save(activity);
        
        return convertToDTO(sessionRepository.save(session));
    }
    
    public void addParticipant(Long sessionId, Long userId) {
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if already participating
        if (participantRepository.findByStudySessionIdAndUserId(sessionId, userId).isPresent()) {
            throw new RuntimeException("User already in this session");
        }
        
        SessionParticipant participant = SessionParticipant.builder()
            .studySession(session)
            .user(user)
            .build();
        
        participantRepository.save(participant);
        
        // Log activity
        Activity activity = Activity.builder()
            .type(ActivityType.JOINED)
            .studySession(session)
            .user(user)
            .build();
        activityRepository.save(activity);
    }
    
    public void removeParticipant(Long sessionId, Long userId) {
        SessionParticipant participant = participantRepository.findByStudySessionIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new RuntimeException("Participant not found"));
        
        participant.setLeftAt(LocalDateTime.now());
        participantRepository.save(participant);
        
        // Log activity
        Activity activity = Activity.builder()
            .type(ActivityType.LEFT)
            .studySession(participant.getStudySession())
            .user(participant.getUser())
            .build();
        activityRepository.save(activity);
    }
    
    @Transactional(readOnly = true)
    public List<StudySessionDTO> getGroupSessions(Long groupId) {
        return sessionRepository.findByStudyGroupId(groupId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private String generateRoomCode() {
        return "ROOM-" + System.currentTimeMillis();
    }
    
    private StudySessionDTO convertToDTO(StudySession session) {
        return StudySessionDTO.builder()
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
            .createdAt(session.getCreatedAt())
            .creatorId(session.getCreator().getId())
            .studyGroupId(session.getStudyGroup() != null ? session.getStudyGroup().getId() : null)
            .build();
    }
}
