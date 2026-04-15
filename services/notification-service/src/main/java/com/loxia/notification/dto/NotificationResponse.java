package com.loxia.notification.dto;

import com.loxia.notification.domain.Notification;
import com.loxia.notification.domain.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private UUID relatedListingId;
    private UUID relatedApplicationId;
    private boolean read;
    private OffsetDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .relatedListingId(n.getRelatedListingId())
                .relatedApplicationId(n.getRelatedApplicationId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
