package com.loxia.catalog.service;

import com.loxia.catalog.domain.Listing;
import com.loxia.catalog.dto.*;
import com.loxia.catalog.repository.ListingRepository;
import com.loxia.catalog.repository.ListingSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ListingService {

    private final ListingRepository listingRepository;
    private final AuthClientService authClientService;
    private final RentalClientService rentalClientService;

    @Transactional
    public ListingResponse create(CreateListingRequest request, UUID ownerId) {
        Listing listing = Listing.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .propertyType(request.getPropertyType())
                .city(request.getCity())
                .price(request.getPrice())
                .surface(request.getSurface())
                .rooms(request.getRooms())
                .photoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : List.of())
                .ownerId(ownerId)
                .build();
        listing = listingRepository.save(listing);
        log.info("Listing created: {} by owner {}", listing.getId(), ownerId);
        String ownerName = authClientService.getOwnerName(ownerId);
        return ListingResponse.from(listing, ownerName);
    }

    @Transactional
    public ListingResponse update(UUID listingId, UpdateListingRequest request, UUID userId) {
        Listing listing = findByIdOrThrow(listingId);
        assertOwner(listing, userId);
        assertNotLocked(listingId);

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setPropertyType(request.getPropertyType());
        listing.setCity(request.getCity());
        listing.setPrice(request.getPrice());
        listing.setSurface(request.getSurface());
        listing.setRooms(request.getRooms());
        listing.setPhotoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : List.of());

        listing = listingRepository.save(listing);
        log.info("Listing updated: {}", listingId);
        String ownerName = authClientService.getOwnerName(listing.getOwnerId());
        return ListingResponse.from(listing, ownerName);
    }

    @Transactional
    public void delete(UUID listingId, UUID userId) {
        Listing listing = findByIdOrThrow(listingId);
        assertOwner(listing, userId);
        assertNotLocked(listingId);

        listingRepository.delete(listing);
        log.info("Listing deleted: {}", listingId);
    }

    @Transactional(readOnly = true)
    public ListingResponse getById(UUID listingId) {
        Listing listing = findByIdOrThrow(listingId);
        String ownerName = authClientService.getOwnerName(listing.getOwnerId());
        boolean locked = rentalClientService.isLocked(listingId);
        return ListingResponse.from(listing, ownerName, locked);
    }

    @Transactional(readOnly = true)
    public List<ListingSummaryResponse> search(String city, String propertyType,
                                               Integer minPrice, Integer maxPrice) {
        Specification<Listing> spec = Specification.where(null);

        if (city != null && !city.isBlank()) {
            spec = spec.and(ListingSpecifications.cityContains(city));
        }
        if (propertyType != null && !propertyType.isBlank()) {
            spec = spec.and(ListingSpecifications.propertyTypeEquals(propertyType));
        }
        if (minPrice != null) {
            spec = spec.and(ListingSpecifications.priceMin(minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and(ListingSpecifications.priceMax(maxPrice));
        }

        return listingRepository.findAll(spec).stream()
                .map(ListingSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ListingSummaryResponse> getMyListings(UUID ownerId) {
        List<Listing> listings = listingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        if (listings.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = listings.stream().map(Listing::getId).toList();
        Map<UUID, Boolean> lockStatuses = rentalClientService.getLockStatuses(ids);
        return listings.stream()
                .map(l -> ListingSummaryResponse.from(l, Boolean.TRUE.equals(lockStatuses.get(l.getId()))))
                .toList();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private Listing findByIdOrThrow(UUID id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Listing not found"));
    }

    private void assertOwner(Listing listing, UUID userId) {
        if (!listing.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You are not the owner of this listing");
        }
    }

    private void assertNotLocked(UUID listingId) {
        if (rentalClientService.isLocked(listingId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This listing has pending or accepted applications and cannot be modified");
        }
    }
}
