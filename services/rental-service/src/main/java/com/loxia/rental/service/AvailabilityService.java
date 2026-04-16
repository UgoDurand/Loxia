package com.loxia.rental.service;

import com.loxia.rental.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final ApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public boolean isAvailable(UUID listingId, LocalDate startDate, LocalDate endDate) {
        return !applicationRepository.existsOverlappingAcceptedApplication(listingId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public Map<UUID, Boolean> getAvailabilityStatuses(List<UUID> listingIds, LocalDate startDate, LocalDate endDate) {
        Set<UUID> uniqueIds = new HashSet<>(listingIds);
        Set<UUID> unavailableIds = new HashSet<>(
                applicationRepository.findUnavailableListingIds(uniqueIds, startDate, endDate));

        Map<UUID, Boolean> result = new HashMap<>();
        for (UUID id : uniqueIds) {
            result.put(id, !unavailableIds.contains(id));
        }
        return result;
    }
}
