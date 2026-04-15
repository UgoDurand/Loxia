package com.loxia.rental.service;

import com.loxia.rental.domain.ApplicationStatus;
import com.loxia.rental.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LockService {

    private static final Set<ApplicationStatus> LOCKING_STATUSES =
            Set.of(ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED);

    private final ApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public boolean isListingLocked(UUID listingId) {
        return applicationRepository.existsByListingIdAndStatusIn(listingId, LOCKING_STATUSES);
    }

    @Transactional(readOnly = true)
    public Map<UUID, Boolean> getLockStatuses(List<UUID> listingIds) {
        Set<UUID> uniqueIds = new HashSet<>(listingIds);
        Set<UUID> lockedIds = new HashSet<>(
                applicationRepository.findLockedListingIds(uniqueIds, LOCKING_STATUSES));

        Map<UUID, Boolean> result = new HashMap<>();
        for (UUID id : uniqueIds) {
            result.put(id, lockedIds.contains(id));
        }
        return result;
    }
}
