package com.loxia.rental.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AvailabilityResponse {
    /** listingId → true if available, false if booked for the requested period */
    private Map<UUID, Boolean> availability;
}
