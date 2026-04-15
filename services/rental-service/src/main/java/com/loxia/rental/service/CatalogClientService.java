package com.loxia.rental.service;

import com.loxia.rental.dto.external.ExternalListingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogClientService {

    private final RestClient catalogRestClient;

    public Optional<ExternalListingResponse> getListing(UUID listingId) {
        try {
            ExternalListingResponse response = catalogRestClient.get()
                    .uri("/internal/listings/{id}", listingId)
                    .retrieve()
                    .body(ExternalListingResponse.class);
            return Optional.ofNullable(response);
        } catch (Exception e) {
            log.warn("Failed to fetch listing {}: {}", listingId, e.getMessage());
            return Optional.empty();
        }
    }

    public List<UUID> getListingIdsByOwner(UUID ownerId) {
        try {
            List<Map<String, Object>> response = catalogRestClient.get()
                    .uri("/internal/listings/owner/{ownerId}", ownerId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
            if (response == null) {
                return List.of();
            }
            return response.stream()
                    .map(m -> UUID.fromString((String) m.get("id")))
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to fetch listings for owner {}: {}", ownerId, e.getMessage());
            return List.of();
        }
    }
}
