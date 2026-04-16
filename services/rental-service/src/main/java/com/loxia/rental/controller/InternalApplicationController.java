package com.loxia.rental.controller;

import com.loxia.rental.dto.AvailabilityRequest;
import com.loxia.rental.dto.AvailabilityResponse;
import com.loxia.rental.dto.BatchLockRequest;
import com.loxia.rental.dto.BatchLockResponse;
import com.loxia.rental.dto.LockStatusResponse;
import com.loxia.rental.service.AvailabilityService;
import com.loxia.rental.service.LockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/applications")
@RequiredArgsConstructor
public class InternalApplicationController {

    private final LockService lockService;
    private final AvailabilityService availabilityService;

    @GetMapping("/listing/{id}/locked")
    public LockStatusResponse isListingLocked(@PathVariable UUID id) {
        return new LockStatusResponse(lockService.isListingLocked(id));
    }

    @PostMapping("/locks")
    public BatchLockResponse getLockStatuses(@Valid @RequestBody BatchLockRequest request) {
        return BatchLockResponse.builder()
                .locks(lockService.getLockStatuses(request.getListingIds()))
                .build();
    }

    /**
     * Checks whether a listing is available (no ACCEPTED application overlapping the given period).
     */
    @GetMapping("/listing/{id}/availability")
    public Map<String, Boolean> isListingAvailable(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return Map.of("available", availabilityService.isAvailable(id, start, end));
    }

    /**
     * Batch availability check for a list of listing IDs and a date range.
     */
    @PostMapping("/availability-batch")
    public AvailabilityResponse getAvailabilityBatch(@Valid @RequestBody AvailabilityRequest request) {
        return AvailabilityResponse.builder()
                .availability(availabilityService.getAvailabilityStatuses(
                        request.getListingIds(), request.getStartDate(), request.getEndDate()))
                .build();
    }
}
