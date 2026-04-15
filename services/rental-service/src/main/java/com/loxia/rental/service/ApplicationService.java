package com.loxia.rental.service;

import com.loxia.rental.domain.Application;
import com.loxia.rental.domain.ApplicationStatus;
import com.loxia.rental.dto.ApplicationResponse;
import com.loxia.rental.dto.CreateApplicationRequest;
import com.loxia.rental.dto.external.ExternalListingResponse;
import com.loxia.rental.dto.external.ExternalUserResponse;
import com.loxia.rental.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private static final Set<ApplicationStatus> ACTIVE_STATUSES =
            Set.of(ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED);

    private final ApplicationRepository applicationRepository;
    private final CatalogClientService catalogClientService;
    private final AuthClientService authClientService;

    @Transactional
    public ApplicationResponse create(UUID applicantId, CreateApplicationRequest request) {
        ExternalListingResponse listing = catalogClientService.getListing(request.getListingId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Listing not found"));

        if (applicantId.equals(listing.getOwnerId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "You cannot apply to your own listing");
        }

        boolean alreadyApplied = applicationRepository.existsByListingIdAndApplicantIdAndStatusIn(
                request.getListingId(), applicantId, ACTIVE_STATUSES);
        if (alreadyApplied) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have an active application on this listing");
        }

        Application application = Application.builder()
                .listingId(request.getListingId())
                .applicantId(applicantId)
                .monthlyIncome(request.getMonthlyIncome())
                .employmentStatus(request.getEmploymentStatus())
                .message(request.getMessage())
                .status(ApplicationStatus.PENDING)
                .build();
        application = applicationRepository.save(application);
        log.info("Application created: {} by applicant {} on listing {}",
                application.getId(), applicantId, request.getListingId());

        ExternalUserResponse applicant = authClientService.getUser(applicantId).orElse(null);
        return toResponse(application, listing, applicant);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(UUID applicantId) {
        List<Application> applications = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
        return enrichAll(applications);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getReceivedApplications(UUID ownerId) {
        List<UUID> ownedListingIds = catalogClientService.getListingIdsByOwner(ownerId);
        if (ownedListingIds.isEmpty()) {
            return List.of();
        }
        List<Application> applications = applicationRepository.findByListingIdInOrderByCreatedAtDesc(ownedListingIds);
        return enrichAll(applications);
    }

    @Transactional
    public ApplicationResponse accept(UUID applicationId, UUID ownerId) {
        return transition(applicationId, ownerId, ApplicationStatus.ACCEPTED);
    }

    @Transactional
    public ApplicationResponse reject(UUID applicationId, UUID ownerId) {
        return transition(applicationId, ownerId, ApplicationStatus.REJECTED);
    }

    private ApplicationResponse transition(UUID applicationId, UUID ownerId, ApplicationStatus newStatus) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found"));

        ExternalListingResponse listing = catalogClientService.getListing(application.getListingId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Listing not found"));

        if (!ownerId.equals(listing.getOwnerId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You are not the owner of this listing");
        }

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only pending applications can be updated");
        }

        application.setStatus(newStatus);
        application = applicationRepository.save(application);
        log.info("Application {} transitioned to {} by owner {}", applicationId, newStatus, ownerId);

        ExternalUserResponse applicant = authClientService.getUser(application.getApplicantId()).orElse(null);
        return toResponse(application, listing, applicant);
    }

    private List<ApplicationResponse> enrichAll(List<Application> applications) {
        if (applications.isEmpty()) {
            return List.of();
        }

        Map<UUID, ExternalListingResponse> listingCache = new HashMap<>();
        Map<UUID, ExternalUserResponse> userCache = new HashMap<>();

        for (Application app : applications) {
            listingCache.computeIfAbsent(app.getListingId(),
                    id -> catalogClientService.getListing(id).orElse(null));
            userCache.computeIfAbsent(app.getApplicantId(),
                    id -> authClientService.getUser(id).orElse(null));
        }

        return applications.stream()
                .map(app -> toResponse(app, listingCache.get(app.getListingId()), userCache.get(app.getApplicantId())))
                .toList();
    }

    private ApplicationResponse toResponse(Application app,
                                           ExternalListingResponse listing,
                                           ExternalUserResponse applicant) {
        ApplicationResponse.ApplicationResponseBuilder builder = ApplicationResponse.builder()
                .id(app.getId())
                .listingId(app.getListingId())
                .applicantId(app.getApplicantId())
                .monthlyIncome(app.getMonthlyIncome())
                .employmentStatus(app.getEmploymentStatus())
                .message(app.getMessage())
                .status(app.getStatus())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt());

        if (listing != null) {
            builder.listingTitle(listing.getTitle())
                    .listingCity(listing.getCity())
                    .listingPrice(listing.getPrice())
                    .listingOwnerId(listing.getOwnerId());
        }
        if (applicant != null) {
            builder.applicantFullName(applicant.getFullName())
                    .applicantEmail(applicant.getEmail());
        }
        return builder.build();
    }
}
