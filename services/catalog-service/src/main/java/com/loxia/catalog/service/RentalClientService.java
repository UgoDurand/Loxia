package com.loxia.catalog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
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

    /**
     * Batch lock check. Returns a map listingId → locked for every id in the
     * input. Fail-safe: on error, returns all entries as true (blocks by default)
     * so the UI does not accidentally expose edit/delete actions for a listing
     * whose state is unknown.
     */
    public Map<UUID, Boolean> getLockStatuses(List<UUID> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("listingIds", listingIds);
            Map<String, Object> response = rentalRestClient.post()
                    .uri("/internal/applications/locks")
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            if (response != null && response.get("locks") instanceof Map<?, ?> rawLocks) {
                Map<UUID, Boolean> result = new HashMap<>();
                for (Map.Entry<?, ?> entry : rawLocks.entrySet()) {
                    UUID id = UUID.fromString(entry.getKey().toString());
                    result.put(id, Boolean.TRUE.equals(entry.getValue()));
                }
                return result;
            }
        } catch (Exception e) {
            log.warn("Failed batch lock check for {} ids: {} — marking all as locked (fail-safe)",
                    listingIds.size(), e.getMessage());
        }
        Map<UUID, Boolean> failSafe = new HashMap<>();
        for (UUID id : listingIds) {
            failSafe.put(id, true);
        }
        return failSafe;
    }

    /**
     * Batch availability check: returns a map listingId → true if available for the given period.
     * Fail-safe: on error, marks all as available (do not hide listings when rental-service is down).
     */
    public Map<UUID, Boolean> getAvailabilityStatuses(List<UUID> listingIds, LocalDate start, LocalDate end) {
        if (listingIds == null || listingIds.isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("listingIds", listingIds);
            body.put("startDate", start.toString());
            body.put("endDate", end.toString());
            Map<String, Object> response = rentalRestClient.post()
                    .uri("/internal/applications/availability-batch")
                    .body(body)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
            if (response != null && response.get("availability") instanceof Map<?, ?> raw) {
                Map<UUID, Boolean> result = new HashMap<>();
                for (Map.Entry<?, ?> entry : raw.entrySet()) {
                    UUID id = UUID.fromString(entry.getKey().toString());
                    result.put(id, Boolean.TRUE.equals(entry.getValue()));
                }
                return result;
            }
        } catch (Exception e) {
            log.warn("Failed batch availability check for {} ids: {} — marking all as available (fail-safe)",
                    listingIds.size(), e.getMessage());
        }
        // Fail-safe: show listings even if rental-service is unreachable
        Map<UUID, Boolean> failSafe = new HashMap<>();
        for (UUID id : listingIds) {
            failSafe.put(id, true);
        }
        return failSafe;
    }
}
