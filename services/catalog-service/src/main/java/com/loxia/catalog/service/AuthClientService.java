package com.loxia.catalog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/**
 * Client for auth-service internal API.
 * Used to enrich listings with the owner's full name.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthClientService {

    private final RestClient authRestClient;

    /**
     * Fetches the owner's full name from auth-service.
     * Returns null if the call fails (graceful degradation).
     */
    public String getOwnerName(UUID ownerId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = authRestClient.get()
                    .uri("/internal/users/{id}", ownerId)
                    .retrieve()
                    .body(Map.class);
            if (response != null && response.containsKey("fullName")) {
                return (String) response.get("fullName");
            }
        } catch (Exception e) {
            log.warn("Failed to fetch owner name for userId={}: {}", ownerId, e.getMessage());
        }
        return null;
    }
}
