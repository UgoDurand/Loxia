package com.loxia.catalog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/**
 * Client for rental-service internal API.
 * Used to check the lock rule before modifying or deleting a listing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RentalClientService {

    private final RestClient rentalRestClient;

    /**
     * Checks whether a listing is locked (has PENDING or ACCEPTED applications).
     * Fail-safe: returns true (blocks modification) if rental-service is unreachable.
     */
    public boolean isLocked(UUID listingId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = rentalRestClient.get()
                    .uri("/internal/applications/listing/{id}/locked", listingId)
                    .retrieve()
                    .body(Map.class);
            if (response != null && response.containsKey("locked")) {
                return Boolean.TRUE.equals(response.get("locked"));
            }
        } catch (Exception e) {
            log.warn("Failed to check lock status for listingId={}: {} — blocking modification (fail-safe)",
                    listingId, e.getMessage());
            return true; // fail-safe: block if rental-service is down
        }
        return false;
    }
}
