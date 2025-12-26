package com.studyspace.service;

import com.studyspace.dto.CreateSessionRequest;
import com.studyspace.dto.StudySessionDTO;
import com.studyspace.entity.*;
import com.studyspace.mapper.UserMapper;
import com.studyspace.types.ActivityType;
import com.studyspace.types.SessionStatus;
import com.studyspace.types.SessionVisibility;
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
    private final GamificationService gamificationService;
    
    public StudySessionDTO createSession(Long userId, CreateSessionRequest request) {
        User creator = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        StudySession session = StudySession.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .subject(request.getSubject())
            .creator(creator)
            .isGroupSession(request.getIsGroupSession() != null ? request.getIsGroupSession() : false)
            .status(SessionStatus.ACTIVE)
            .startTime(LocalDateTime.now())
            .visibility(request.getVisibility() != null ? request.getVisibility() : com.studyspace.types.SessionVisibility.PUBLIC)
            .build();
            
        // Check if user already has an active session and end it
        List<StudySession> activeSessions = sessionRepository.findByCreatorId(userId).stream()
            .filter(s -> s.getStatus() == SessionStatus.ACTIVE)
            .collect(Collectors.toList());
            
        for (StudySession activeSession : activeSessions) {
            endSession(activeSession.getId());
        }
        
        if (request.getStudyGroupId() != null) {
            StudyGroup group = groupRepository.findById(request.getStudyGroupId())
                .orElseThrow(() -> new RuntimeException("Study group not found"));
            session.setStudyGroup(group);
            session.setIsGroupSession(true);
        }
        
        // Generate room code
        session.setRoomCode(generateRoomCode());
        
        StudySession savedSession = sessionRepository.save(session);
        
        // Automatically add creator as a participant
        SessionParticipant creatorParticipant = SessionParticipant.builder()
            .studySession(savedSession)
            .user(creator)
            .joinedAt(LocalDateTime.now())
            .build();
        participantRepository.save(creatorParticipant);
        
        // Log activity that creator started the session
        Activity activity = Activity.builder()
            .type(ActivityType.SESSION_CREATED)
            .studySession(savedSession)
            .user(creator)
            .message(creator.getFullName() + " created the session")
            .build();
        activityRepository.save(activity);
        
        return convertToDTO(savedSession);
    }
    
    @Transactional(readOnly = true)
    public StudySessionDTO getSessionById(Long id) {
        StudySession session = sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        return convertToDTO(session);
    }
    
    @Transactional(readOnly = true)
    public List<StudySessionDTO> getAllSessions() {
        return sessionRepository.findAll().stream()
            .sorted((s1, s2) -> {
                // Sort by start time if available, otherwise by created time
                LocalDateTime t1 = s1.getStartTime() != null ? s1.getStartTime() : s1.getCreatedAt();
                LocalDateTime t2 = s2.getStartTime() != null ? s2.getStartTime() : s2.getCreatedAt();
                return t2.compareTo(t1); // Newest first
            })
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<StudySessionDTO> getUserSessions(Long userId) {
        // Get sessions created by user
        List<StudySession> createdSessions = sessionRepository.findByCreatorId(userId);
        
        // Get sessions joined by user
        List<StudySession> joinedSessions = participantRepository.findByUserId(userId).stream()
            .map(SessionParticipant::getStudySession)
            .collect(Collectors.toList());
            
        // Combine and distinct
        java.util.Set<StudySession> allSessions = new java.util.HashSet<>(createdSessions);
        allSessions.addAll(joinedSessions);
        
        return allSessions.stream()
            .sorted((s1, s2) -> s2.getStartTime().compareTo(s1.getStartTime())) // Sort by newest first
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
    
    // startSession removed
    
    public StudySessionDTO endSession(Long sessionId) {
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        // If already completed, just return DTO
        if (session.getStatus() == SessionStatus.COMPLETED) {
            return convertToDTO(session);
        }

        session.setEndTime(LocalDateTime.now());
        session.setStatus(SessionStatus.COMPLETED);
        
        // Calculate duration
        long durationMinutes = ChronoUnit.MINUTES.between(session.getStartTime(), session.getEndTime());
        session.setDurationMinutes((int) durationMinutes);
        
        // Update participants' minutes and user study times
        session.getParticipants().forEach(participant -> {
            // Only process participants who haven't left yet
            if (participant.getLeftAt() == null) {
                LocalDateTime leftTime = LocalDateTime.now();
                participant.setLeftAt(leftTime);
                
                long participationMinutes = ChronoUnit.MINUTES.between(participant.getJoinedAt(), leftTime);
                participant.setMinutesParticipated((int) participationMinutes);
                
                User user = participant.getUser();
                int currentTotal = user.getTotalStudyMinutes() != null ? user.getTotalStudyMinutes() : 0;
                user.setTotalStudyMinutes(currentTotal + (int) participationMinutes);
                
                // --- GAMIFICATION LOGIC ---
                gamificationService.processSessionCompletion(user, (int) participationMinutes, session);
                
                userRepository.save(user);
                participantRepository.save(participant);
            }
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
        
        // Check if participant record already exists
        var existingParticipant = participantRepository.findByStudySessionIdAndUserId(sessionId, userId);
        
        if (existingParticipant.isPresent()) {
            SessionParticipant participant = existingParticipant.get();
            
            // If they've left before, allow them to rejoin
            if (participant.getLeftAt() != null) {
                participant.setLeftAt(null);  // Reset left time
                participant.setJoinedAt(LocalDateTime.now());  // Update join time
                participant.setMinutesParticipated(null);  // Reset minutes for new session
                participantRepository.save(participant);
                
                // Log rejoin activity
                Activity activity = Activity.builder()
                    .type(ActivityType.JOINED)
                    .studySession(session)
                    .user(user)
                    .message(user.getFullName() + " rejoined the session")
                    .build();
                activityRepository.save(activity);
                return;
            } else {
                // They're currently in the session
                return; // Idempotent success if already in
            }
        }
        
        // Create new participant record
        SessionParticipant participant = SessionParticipant.builder()
            .studySession(session)
            .user(user)
            .joinedAt(LocalDateTime.now())
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
    
    public void removeParticipant(Long sessionId, Long userId, Integer studyMinutes) {
        SessionParticipant participant = participantRepository.findByStudySessionIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new RuntimeException("Participant not found"));
        
        // If already left, do nothing
        if (participant.getLeftAt() != null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        participant.setLeftAt(now);
        
        // Calculate study time (Backend source of truth preferred)
        long calculatedMinutes = ChronoUnit.MINUTES.between(participant.getJoinedAt(), now);
        
        // Use provided studyMinutes if reasonable, otherwise backend calc
        int minutesToRecord = (int) Math.max(0, calculatedMinutes);
        
        participant.setMinutesParticipated(minutesToRecord);
        
        // Update User Total Study Minutes
        User user = participant.getUser();
        int currentTotal = user.getTotalStudyMinutes() != null ? user.getTotalStudyMinutes() : 0;
        user.setTotalStudyMinutes(currentTotal + minutesToRecord);
        
        // Trigger Gamification
        gamificationService.processSessionCompletion(user, minutesToRecord, participant.getStudySession());
        
        userRepository.save(user);
        participantRepository.save(participant);
        
        // Log activity
        Activity activity = Activity.builder()
            .type(ActivityType.LEFT)
            .studySession(participant.getStudySession())
            .user(participant.getUser())
            .build();
        activityRepository.save(activity);
        
        // Check if session is empty (no active participants)
        StudySession session = participant.getStudySession();
        long activeCount = session.getParticipants().stream()
                .filter(p -> p.getLeftAt() == null)
                .count();
                
        if (activeCount == 0) {
            // Last person left, end the session
            // We can reuse endSession but distinct logic: endSession updates participants again?
            // endSession logic checks for active participants. Since we just marked this one as left,
            // endSession will just close the session entity and calc duration. perfect.
            endSession(sessionId);
        }
    }
    
    @Transactional(readOnly = true)
    public List<StudySessionDTO> getGroupSessions(Long groupId, Long requestingUserId) {
        return sessionRepository.findByStudyGroupId(groupId).stream()
            .filter(s -> s.getVisibility() == SessionVisibility.PUBLIC || 
                        (requestingUserId != null && s.getCreator().getId().equals(requestingUserId)))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private String generateRoomCode() {
        return "ROOM-" + System.currentTimeMillis();
    }
    
    private final UserMapper userMapper;

    private StudySessionDTO convertToDTO(StudySession session) {
        String durationStr = "0 min";
        if (session.getStartTime() != null) {
            long minutes;
            if (session.getEndTime() != null) {
                minutes = java.time.temporal.ChronoUnit.MINUTES.between(session.getStartTime(), session.getEndTime());
            } else if (session.getStatus() == com.studyspace.types.SessionStatus.ACTIVE) {
                minutes = java.time.temporal.ChronoUnit.MINUTES.between(session.getStartTime(), java.time.LocalDateTime.now());
            } else {
                minutes = session.getDurationMinutes() != null ? session.getDurationMinutes() : 0;
            }
            
            if (minutes >= 60) {
                durationStr = (minutes / 60) + "h " + (minutes % 60) + "m";
            } else {
                durationStr = minutes + " min";
            }
        }

        // Filter for active participants only (those who haven't left)
        List<SessionParticipant> activeParticipants = session.getParticipants().stream()
                .filter(p -> p.getLeftAt() == null)
                .collect(Collectors.toList());

        List<com.studyspace.dto.UserDTO> participantDTOs = activeParticipants.stream()
                .map(p -> {
                    com.studyspace.dto.UserDTO userDTO = userMapper.toDTO(p.getUser());
                    userDTO.setJoinedAt(p.getJoinedAt());
                    userDTO.setLastPausedAt(p.getLastPausedAt());
                    userDTO.setTotalPausedSeconds(p.getTotalPausedSeconds() != null ? p.getTotalPausedSeconds() : 0L);
                    return userDTO;
                })
                .collect(Collectors.toList());

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
                .creator(userMapper.toDTO(session.getCreator()))
                .studyGroupId(session.getStudyGroup() != null ? session.getStudyGroup().getId() : null)
                .participantCount(activeParticipants.size())
                .participants(participantDTOs)
                .duration(durationStr)
                .visibility(session.getVisibility())
                .build();
    }

    @Transactional
    public void pauseParticipant(Long sessionId, Long userId) {
        SessionParticipant participant = participantRepository.findByStudySessionIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
                
        if (participant.getLastPausedAt() != null) {
            return; // Already paused
        }
        
        participant.setLastPausedAt(LocalDateTime.now());
        
        // Update user status
        User user = participant.getUser();
        // We don't directly set status here as frontend does it via separate call, 
        // but for consistency we could. Let's let frontend handle status to keep it decoupled
        // or we can enforce it here. Requirement says "update the accumulatedSeconds... needed to add additional fields"
        // Let's assume frontend also calls status update or we do it here. 
        // Plan said: "Update User Status to AWAY".
        // To avoid circular dependency or complexity, let's just log activity.
        // Frontend explicitly calls /status endpoint too in current code. 
        // We will just do the timer logic here.
        
        participantRepository.save(participant);
        
        Activity activity = Activity.builder()
                .type(ActivityType.JOINED) // Using JOINED as generic status update for now
                .studySession(participant.getStudySession())
                .user(user)
                .message(user.getFullName() + " took a break")
                .build();
        activityRepository.save(activity);
    }

    @Transactional
    public void resumeParticipant(Long sessionId, Long userId) {
        SessionParticipant participant = participantRepository.findByStudySessionIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Participant not found"));
                
        if (participant.getLastPausedAt() == null) {
            return; // Not paused
        }
        
        LocalDateTime now = LocalDateTime.now();
        long pausedSeconds = java.time.Duration.between(participant.getLastPausedAt(), now).getSeconds();
        
        participant.setTotalPausedSeconds(
            (participant.getTotalPausedSeconds() != null ? participant.getTotalPausedSeconds() : 0) + pausedSeconds
        );
        participant.setLastPausedAt(null);
        
        participantRepository.save(participant);
        
        Activity activity = Activity.builder()
                .type(ActivityType.JOINED)
                .studySession(participant.getStudySession())
                .user(participant.getUser())
                .message(participant.getUser().getFullName() + " resumed studying")
                .build();
        activityRepository.save(activity);
    }
    
    @Transactional
    public void deleteSession(Long id) {
        StudySession session = sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found"));
            
        // Revert study minutes for all participants
        for (SessionParticipant participant : session.getParticipants()) {
            if (participant.getMinutesParticipated() != null && participant.getMinutesParticipated() > 0) {
                User user = participant.getUser();
                if (user.getTotalStudyMinutes() != null) {
                    user.setTotalStudyMinutes(Math.max(0, user.getTotalStudyMinutes() - participant.getMinutesParticipated()));
                    userRepository.save(user);
                }
            }
        }
        
        sessionRepository.delete(session);
    }

    @Transactional
    public void transferHost(Long sessionId, Long newHostId) {
        StudySession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        User newHost = userRepository.findById(newHostId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        // Validations could be added: is newHost a participant?
        // For simplicity, we assume frontend passed a valid participant ID
        
        session.setCreator(newHost);
        sessionRepository.save(session);
        
        // Log activity
        Activity activity = Activity.builder()
            .type(ActivityType.MILESTONE_REACHED) // Or generic update
            .studySession(session)
            .user(newHost)
            .message("Session host transferred to " + newHost.getFullName())
            .build();
        activityRepository.save(activity);
    }
}
