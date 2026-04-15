package com.loxia.rental.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationClientService {

    private final RestClient notificationRestClient;

    public void send(UUID userId,
                     String type,
                     String title,
                     String message,
                     UUID relatedListingId,
                     UUID relatedApplicationId) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("userId", userId);
            payload.put("type", type);
            payload.put("title", title);
            payload.put("message", message);
            if (relatedListingId != null) {
                payload.put("relatedListingId", relatedListingId);
            }
            if (relatedApplicationId != null) {
                payload.put("relatedApplicationId", relatedApplicationId);
            }
            notificationRestClient.post()
                    .uri("/internal/notifications")
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to send notification to user {} (type={}): {}",
                    userId, type, e.getMessage());
        }
    }
}
