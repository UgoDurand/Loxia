package com.loxia.catalog.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Service
@Slf4j
public class GeocodingService {

    private final RestClient nominatimClient;

    public GeocodingService() {
        this.nominatimClient = RestClient.builder()
                .baseUrl("https://nominatim.openstreetmap.org")
                .defaultHeader("User-Agent", "Loxia-App/1.0")
                .defaultHeader("Accept-Language", "fr")
                .build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record NominatimResult(String lat, String lon) {}

    /**
     * Geocode a city name to lat/lng using Nominatim.
     * Returns null if geocoding fails — listing is saved without coordinates.
     */
    public double[] geocode(String city) {
        if (city == null || city.isBlank()) return null;
        try {
            List<NominatimResult> results = nominatimClient.get()
                    .uri("/search?q={city}&format=json&limit=1&countrycodes=fr", city)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});

            if (results != null && !results.isEmpty()) {
                double lat = Double.parseDouble(results.get(0).lat());
                double lon = Double.parseDouble(results.get(0).lon());
                log.debug("Geocoded '{}' -> lat={}, lon={}", city, lat, lon);
                return new double[]{lat, lon};
            }
        } catch (RestClientException | NumberFormatException e) {
            log.warn("Geocoding failed for '{}': {}", city, e.getMessage());
        }
        return null;
    }
}
