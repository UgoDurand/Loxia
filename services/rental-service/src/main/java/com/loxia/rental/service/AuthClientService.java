package com.loxia.rental.service;

import com.loxia.rental.dto.external.ExternalUserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthClientService {

    private final RestClient authRestClient;

    public Optional<ExternalUserResponse> getUser(UUID userId) {
        try {
            ExternalUserResponse response = authRestClient.get()
                    .uri("/internal/users/{id}", userId)
                    .retrieve()
                    .body(ExternalUserResponse.class);
            return Optional.ofNullable(response);
        } catch (Exception e) {
            log.warn("Failed to fetch user {}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }
}
