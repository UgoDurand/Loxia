package com.loxia.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StartConversationRequest(
        @NotNull UUID listingId,
        @NotBlank String listingTitle,
        @NotNull UUID ownerId,
        @NotBlank String ownerName
) {}
