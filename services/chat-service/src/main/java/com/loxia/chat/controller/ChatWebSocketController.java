package com.loxia.chat.controller;

import com.loxia.chat.config.JwtChannelInterceptor.ChatPrincipal;
import com.loxia.chat.dto.MessageResponse;
import com.loxia.chat.dto.SendMessageRequest;
import com.loxia.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handles messages sent to /app/chat/{conversationId}.
     * Persists the message and broadcasts it to /topic/conversation/{conversationId}.
     */
    @MessageMapping("/chat/{conversationId}")
    public void sendMessage(
            @DestinationVariable UUID conversationId,
            @Valid SendMessageRequest request,
            Principal principal) {

        ChatPrincipal chatPrincipal = (ChatPrincipal) principal;
        UUID senderId = chatPrincipal.userId();
        String senderName = chatPrincipal.fullName();

        MessageResponse response = chatService.sendMessage(conversationId, senderId, senderName, request);

        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, response);
        log.debug("Message sent to /topic/conversation/{}: sender={}", conversationId, senderName);
    }
}
