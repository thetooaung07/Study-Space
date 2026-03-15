package com.studyspace.service;

import com.studyspace.dto.ActivityDTO;
import com.studyspace.dto.StudySessionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Broadcasts real-time events to WebSocket subscribers for a given session.
 * All topics follow the pattern: /topic/session/{sessionId}/{event}
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast updated session data (including participant list) to all subscribers.
     */
    public void broadcastParticipantsUpdate(Long sessionId, StudySessionDTO sessionDTO) {
        String destination = "/topic/session/" + sessionId + "/participants";
        log.debug("Broadcasting participants update to {}", destination);
        messagingTemplate.convertAndSend(destination, sessionDTO);
    }

    /**
     * Broadcast a new activity (chat message, hand-raise, status change, etc.)
     */
    public void broadcastActivity(Long sessionId, ActivityDTO activityDTO) {
        String destination = "/topic/session/" + sessionId + "/activities";
        log.debug("Broadcasting activity to {}", destination);
        messagingTemplate.convertAndSend(destination, activityDTO);
    }

    /**
     * Broadcast session ended event, notifying all participants to leave.
     */
    public void broadcastSessionEnded(Long sessionId) {
        String destination = "/topic/session/" + sessionId + "/ended";
        log.debug("Broadcasting session ended to {}", destination);
        messagingTemplate.convertAndSend(destination, Map.of(
            "sessionId", sessionId,
            "event", "SESSION_ENDED"
        ));
    }
}
