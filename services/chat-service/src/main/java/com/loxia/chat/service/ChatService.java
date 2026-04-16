package com.loxia.chat.service;

import com.loxia.chat.domain.Conversation;
import com.loxia.chat.domain.Message;
import com.loxia.chat.dto.ConversationResponse;
import com.loxia.chat.dto.MessageResponse;
import com.loxia.chat.dto.SendMessageRequest;
import com.loxia.chat.dto.StartConversationRequest;
import com.loxia.chat.repository.ConversationRepository;
import com.loxia.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;

    @Transactional
    public ConversationResponse getOrCreateConversation(
            UUID tenantId,
            String tenantName,
            StartConversationRequest req) {

        Conversation conv = conversationRepo
                .findByListingIdAndTenantId(req.listingId(), tenantId)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .listingId(req.listingId())
                            .listingTitle(req.listingTitle())
                            .tenantId(tenantId)
                            .tenantName(tenantName)
                            .ownerId(req.ownerId())
                            .ownerName(req.ownerName())
                            .build();
                    log.debug("Creating new conversation for listing={}, tenant={}", req.listingId(), tenantId);
                    return conversationRepo.save(newConv);
                });

        return toResponse(conv);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(UUID userId) {
        return conversationRepo
                .findByTenantIdOrOwnerIdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID conversationId, UUID userId) {
        Conversation conv = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        assertParticipant(conv, userId);
        return messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, UUID senderId, String senderName, SendMessageRequest req) {
        Conversation conv = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        assertParticipant(conv, senderId);

        Message msg = Message.builder()
                .conversation(conv)
                .senderId(senderId)
                .senderName(senderName)
                .content(req.content())
                .build();

        msg = messageRepo.save(msg);
        conv.setUpdatedAt(msg.getCreatedAt());
        conversationRepo.save(conv);

        return toMessageResponse(msg);
    }

    private void assertParticipant(Conversation conv, UUID userId) {
        if (!conv.getTenantId().equals(userId) && !conv.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant of this conversation");
        }
    }

    private ConversationResponse toResponse(Conversation conv) {
        List<Message> messages = messageRepo.findByConversationIdOrderByCreatedAtAsc(conv.getId());
        String lastMsg = messages.isEmpty() ? null : messages.get(messages.size() - 1).getContent();
        return new ConversationResponse(
                conv.getId(),
                conv.getListingId(),
                conv.getListingTitle(),
                conv.getTenantId(),
                conv.getTenantName(),
                conv.getOwnerId(),
                conv.getOwnerName(),
                conv.getCreatedAt(),
                conv.getUpdatedAt(),
                lastMsg
        );
    }

    private MessageResponse toMessageResponse(Message msg) {
        return new MessageResponse(
                msg.getId(),
                msg.getConversation().getId(),
                msg.getSenderId(),
                msg.getSenderName(),
                msg.getContent(),
                msg.getCreatedAt()
        );
    }
}
