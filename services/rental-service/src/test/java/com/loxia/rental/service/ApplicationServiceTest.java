package com.loxia.rental.service;

import com.loxia.rental.domain.Application;
import com.loxia.rental.domain.ApplicationStatus;
import com.loxia.rental.dto.ApplicationResponse;
import com.loxia.rental.dto.CreateApplicationRequest;
import com.loxia.rental.dto.external.ExternalListingResponse;
import com.loxia.rental.dto.external.ExternalUserResponse;
import com.loxia.rental.repository.ApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private CatalogClientService catalogClientService;
    @Mock
    private AuthClientService authClientService;

    @InjectMocks
    private ApplicationService applicationService;

    private UUID ownerId;
    private UUID applicantId;
    private UUID listingId;
    private UUID applicationId;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        applicantId = UUID.randomUUID();
        listingId = UUID.randomUUID();
        applicationId = UUID.randomUUID();
    }

    private ExternalListingResponse sampleListing() {
        ExternalListingResponse l = new ExternalListingResponse();
        l.setId(listingId);
        l.setTitle("Nice flat");
        l.setCity("Paris");
        l.setPrice(1200);
        l.setOwnerId(ownerId);
        return l;
    }

    private CreateApplicationRequest sampleRequest() {
        CreateApplicationRequest r = new CreateApplicationRequest();
        r.setListingId(listingId);
        r.setMonthlyIncome(3000);
        r.setEmploymentStatus("CDI");
        r.setMessage("Hello");
        return r;
    }

    private Application savedApplication(ApplicationStatus status) {
        return Application.builder()
                .id(applicationId)
                .listingId(listingId)
                .applicantId(applicantId)
                .monthlyIncome(3000)
                .employmentStatus("CDI")
                .message("Hello")
                .status(status)
                .build();
    }

    // ─── create ───────────────────────────────────────────────────────────

    @Test
    void create_shouldPersistPendingApplication_whenHappyPath() {
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));
        when(applicationRepository.existsByListingIdAndApplicantIdAndStatusIn(
                eq(listingId), eq(applicantId), anyCollection())).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenReturn(savedApplication(ApplicationStatus.PENDING));
        ExternalUserResponse applicant = new ExternalUserResponse();
        applicant.setFullName("Jane Doe");
        applicant.setEmail("jane@loxia.dev");
        when(authClientService.getUser(applicantId)).thenReturn(Optional.of(applicant));

        ApplicationResponse result = applicationService.create(applicantId, sampleRequest());

        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(result.getListingTitle()).isEqualTo("Nice flat");
        assertThat(result.getApplicantFullName()).isEqualTo("Jane Doe");

        ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
        verify(applicationRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(captor.getValue().getApplicantId()).isEqualTo(applicantId);
    }

    @Test
    void create_shouldRejectWhenListingMissing() {
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.create(applicantId, sampleRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.NOT_FOUND);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void create_shouldRejectWhenApplyingToOwnListing() {
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));

        assertThatThrownBy(() -> applicationService.create(ownerId, sampleRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.BAD_REQUEST);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void create_shouldRejectDuplicateActiveApplication() {
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));
        when(applicationRepository.existsByListingIdAndApplicantIdAndStatusIn(
                eq(listingId), eq(applicantId), anyCollection())).thenReturn(true);

        assertThatThrownBy(() -> applicationService.create(applicantId, sampleRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.CONFLICT);
        verify(applicationRepository, never()).save(any());
    }

    // ─── transitions ─────────────────────────────────────────────────────

    @Test
    void accept_shouldTransitionToAccepted_whenOwnerActsOnPending() {
        Application pending = savedApplication(ApplicationStatus.PENDING);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(pending));
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authClientService.getUser(applicantId)).thenReturn(Optional.empty());

        ApplicationResponse result = applicationService.accept(applicationId, ownerId);

        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.ACCEPTED);
    }

    @Test
    void reject_shouldTransitionToRejected_whenOwnerActsOnPending() {
        Application pending = savedApplication(ApplicationStatus.PENDING);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(pending));
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));
        when(authClientService.getUser(applicantId)).thenReturn(Optional.empty());

        ApplicationResponse result = applicationService.reject(applicationId, ownerId);

        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
    }

    @Test
    void accept_shouldRejectWhenNonOwner() {
        UUID intruder = UUID.randomUUID();
        Application pending = savedApplication(ApplicationStatus.PENDING);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(pending));
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));

        assertThatThrownBy(() -> applicationService.accept(applicationId, intruder))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.FORBIDDEN);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void accept_shouldRejectWhenAlreadyTransitioned() {
        Application rejected = savedApplication(ApplicationStatus.REJECTED);
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.of(rejected));
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));

        assertThatThrownBy(() -> applicationService.accept(applicationId, ownerId))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.CONFLICT);
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void accept_shouldRejectWhenApplicationNotFound() {
        when(applicationRepository.findById(applicationId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.accept(applicationId, ownerId))
                .isInstanceOf(ResponseStatusException.class)
                .matches(e -> ((ResponseStatusException) e).getStatusCode() == HttpStatus.NOT_FOUND);
    }

    // sanity: active statuses contain PENDING and ACCEPTED
    @Test
    void create_shouldCheckDuplicateOnActiveStatusesOnly() {
        when(catalogClientService.getListing(listingId)).thenReturn(Optional.of(sampleListing()));
        when(applicationRepository.existsByListingIdAndApplicantIdAndStatusIn(
                eq(listingId), eq(applicantId), anyCollection())).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenReturn(savedApplication(ApplicationStatus.PENDING));
        when(authClientService.getUser(applicantId)).thenReturn(Optional.empty());

        applicationService.create(applicantId, sampleRequest());

        ArgumentCaptor<Collection<ApplicationStatus>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(applicationRepository).existsByListingIdAndApplicantIdAndStatusIn(
                eq(listingId), eq(applicantId), captor.capture());
        assertThat(captor.getValue())
                .containsExactlyInAnyOrder(ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED);
    }
}
