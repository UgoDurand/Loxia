package com.loxia.chat.controller;

import com.loxia.chat.dto.ConversationResponse;
import com.loxia.chat.dto.MessageResponse;
import com.loxia.chat.dto.StartConversationRequest;
import com.loxia.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

    /**
     * List all conversations where the current user is tenant or owner.
     * Identity comes from the X-User-Id header propagated by the gateway.
     */
    @GetMapping("/conversations")
    public List<ConversationResponse> getConversations(
            @RequestHeader("X-User-Id") UUID userId) {
        return chatService.getConversations(userId);
    }

    /**
     * Get or create a conversation for a listing.
     * Only tenants can initiate a conversation (they provide ownerId in the request body).
     */
    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse startConversation(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-User-FullName") String fullName,
            @Valid @RequestBody StartConversationRequest req) {
        return chatService.getOrCreateConversation(userId, fullName, req);
    }

    /**
     * Fetch message history for a conversation.
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageResponse> getMessages(
            @PathVariable UUID conversationId,
            @RequestHeader("X-User-Id") UUID userId) {
        return chatService.getMessages(conversationId, userId);
    }
}
