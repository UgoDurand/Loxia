package com.loxia.rental.service;

import com.loxia.rental.domain.ApplicationStatus;
import com.loxia.rental.repository.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LockServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @InjectMocks
    private LockService lockService;

    @Test
    void isListingLocked_shouldReturnTrue_whenActiveApplicationExists() {
        UUID listingId = UUID.randomUUID();
        when(applicationRepository.existsByListingIdAndStatusIn(eq(listingId), anyCollection()))
                .thenReturn(true);

        assertThat(lockService.isListingLocked(listingId)).isTrue();
    }

    @Test
    void isListingLocked_shouldReturnFalse_whenNoActiveApplication() {
        UUID listingId = UUID.randomUUID();
        when(applicationRepository.existsByListingIdAndStatusIn(eq(listingId), anyCollection()))
                .thenReturn(false);

        assertThat(lockService.isListingLocked(listingId)).isFalse();
    }

    @Test
    void isListingLocked_shouldQueryOnlyPendingAndAcceptedStatuses() {
        UUID listingId = UUID.randomUUID();
        when(applicationRepository.existsByListingIdAndStatusIn(eq(listingId), argThat(c ->
                ((Collection<ApplicationStatus>) c).containsAll(
                        Set.of(ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED))
                        && !((Collection<ApplicationStatus>) c).contains(ApplicationStatus.REJECTED))))
                .thenReturn(true);

        assertThat(lockService.isListingLocked(listingId)).isTrue();
    }

    @Test
    void getLockStatuses_shouldReturnTrueForLockedAndFalseForUnlocked() {
        UUID lockedId = UUID.randomUUID();
        UUID freeId = UUID.randomUUID();
        when(applicationRepository.findLockedListingIds(anyCollection(), anyCollection()))
                .thenReturn(List.of(lockedId));

        Map<UUID, Boolean> result = lockService.getLockStatuses(List.of(lockedId, freeId));

        assertThat(result).hasSize(2);
        assertThat(result).containsEntry(lockedId, true);
        assertThat(result).containsEntry(freeId, false);
    }

    @Test
    void getLockStatuses_shouldHandleEmptyList() {
        when(applicationRepository.findLockedListingIds(anyCollection(), anyCollection()))
                .thenReturn(List.of());

        Map<UUID, Boolean> result = lockService.getLockStatuses(List.of());

        assertThat(result).isEmpty();
    }

    @Test
    void getLockStatuses_shouldDeduplicateInputIds() {
        UUID id = UUID.randomUUID();
        when(applicationRepository.findLockedListingIds(anyCollection(), anyCollection()))
                .thenReturn(List.of(id));

        Map<UUID, Boolean> result = lockService.getLockStatuses(List.of(id, id, id));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(id, true);
    }
}
