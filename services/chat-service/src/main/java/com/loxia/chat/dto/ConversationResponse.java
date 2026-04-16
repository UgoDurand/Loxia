package com.loxia.chat.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        UUID listingId,
        String listingTitle,
        UUID tenantId,
        String tenantName,
        UUID ownerId,
        String ownerName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        String lastMessage
) {}
