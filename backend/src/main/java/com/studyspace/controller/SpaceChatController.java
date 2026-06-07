package com.studyspace.controller;

import com.studyspace.dto.SpaceMessageDTO;
import com.studyspace.entity.SpaceMessage;
import com.studyspace.entity.User;
import com.studyspace.entity.WorkspaceSpace;
import com.studyspace.repository.SpaceMessageRepository;
import com.studyspace.repository.UserRepository;
import com.studyspace.repository.WorkspaceSpaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces/spaces/{spaceId}/messages")
@RequiredArgsConstructor
@Slf4j
public class SpaceChatController {

    private final SpaceMessageRepository spaceMessageRepository;
    private final WorkspaceSpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<List<SpaceMessageDTO>> getMessages(@PathVariable Long spaceId) {
        List<SpaceMessage> messages = spaceMessageRepository.findBySpaceIdOrderByCreatedAtAsc(spaceId);
        List<SpaceMessageDTO> dtos = messages.stream().map(msg -> SpaceMessageDTO.builder()
                .id(msg.getId())
                .content(msg.getContent())
                .spaceId(msg.getSpace().getId())
                .userId(msg.getUser().getId())
                .userFullName(msg.getUser().getFullName())
                .userProfilePictureUrl(msg.getUser().getProfilePictureUrl())
                .createdAt(msg.getCreatedAt())
                .build()).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<SpaceMessageDTO> sendMessage(
            @PathVariable Long spaceId,
            @RequestBody Map<String, Object> payload) {
        
        Long userId = Long.valueOf(payload.get("userId").toString());
        String content = payload.get("content").toString();

        WorkspaceSpace space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new RuntimeException("Space not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SpaceMessage message = SpaceMessage.builder()
                .space(space)
                .user(user)
                .content(content)
                .build();

        message = spaceMessageRepository.save(message);

        SpaceMessageDTO dto = SpaceMessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .spaceId(message.getSpace().getId())
                .userId(message.getUser().getId())
                .userFullName(message.getUser().getFullName())
                .userProfilePictureUrl(message.getUser().getProfilePictureUrl())
                .createdAt(message.getCreatedAt())
                .build();

        // Broadcast to space members
        String destination = "/topic/space/" + spaceId + "/chat";
        messagingTemplate.convertAndSend(destination, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
