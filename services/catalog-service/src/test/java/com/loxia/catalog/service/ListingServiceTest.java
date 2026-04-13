package com.loxia.catalog.service;

import com.loxia.catalog.domain.Listing;
import com.loxia.catalog.dto.CreateListingRequest;
import com.loxia.catalog.dto.ListingResponse;
import com.loxia.catalog.dto.ListingSummaryResponse;
import com.loxia.catalog.dto.UpdateListingRequest;
import com.loxia.catalog.repository.ListingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;
    @Mock
    private AuthClientService authClientService;
    @Mock
    private RentalClientService rentalClientService;

    @InjectMocks
    private ListingService listingService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID listingId = UUID.randomUUID();

    private Listing sampleListing() {
        return Listing.builder()
                .id(listingId)
                .title("Appartement lumineux")
                .description("Bel appartement en centre-ville")
                .propertyType("Appartement")
                .city("Lyon, France")
                .price(850)
                .surface(45)
                .rooms(2)
                .photoUrls(List.of("https://example.com/photo1.jpg"))
                .ownerId(ownerId)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    void create_shouldSaveAndReturnListing() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Appartement lumineux");
        request.setDescription("Bel appartement");
        request.setPropertyType("Appartement");
        request.setCity("Lyon, France");
        request.setPrice(850);
        request.setSurface(45);
        request.setRooms(2);
        request.setPhotoUrls(List.of("https://example.com/photo1.jpg"));

        Listing saved = sampleListing();
        when(listingRepository.save(any(Listing.class))).thenReturn(saved);
        when(authClientService.getOwnerName(ownerId)).thenReturn("Jean Dupont");

        ListingResponse result = listingService.create(request, ownerId);

        assertThat(result.getTitle()).isEqualTo("Appartement lumineux");
        assertThat(result.getOwnerName()).isEqualTo("Jean Dupont");
        assertThat(result.getOwnerId()).isEqualTo(ownerId);
        verify(listingRepository).save(any(Listing.class));
    }

    @Test
    void update_shouldRejectNonOwner() {
        UUID otherUser = UUID.randomUUID();
        Listing listing = sampleListing();
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));

        UpdateListingRequest request = new UpdateListingRequest();
        request.setTitle("Updated");
        request.setPropertyType("Maison");
        request.setCity("Paris");
        request.setPrice(1000);
        request.setSurface(60);
        request.setRooms(3);

        assertThatThrownBy(() -> listingService.update(listingId, request, otherUser))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not the owner");
    }

    @Test
    void update_shouldRejectWhenLocked() {
        Listing listing = sampleListing();
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(rentalClientService.isLocked(listingId)).thenReturn(true);

        UpdateListingRequest request = new UpdateListingRequest();
        request.setTitle("Updated");
        request.setPropertyType("Maison");
        request.setCity("Paris");
        request.setPrice(1000);
        request.setSurface(60);
        request.setRooms(3);

        assertThatThrownBy(() -> listingService.update(listingId, request, ownerId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("pending or accepted");
    }

    @Test
    void delete_shouldRejectNonOwner() {
        UUID otherUser = UUID.randomUUID();
        Listing listing = sampleListing();
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> listingService.delete(listingId, otherUser))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not the owner");
    }

    @Test
    void delete_shouldRejectWhenLocked() {
        Listing listing = sampleListing();
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(rentalClientService.isLocked(listingId)).thenReturn(true);

        assertThatThrownBy(() -> listingService.delete(listingId, ownerId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("pending or accepted");
    }

    @Test
    void getById_shouldReturnListingWithOwnerName() {
        Listing listing = sampleListing();
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(authClientService.getOwnerName(ownerId)).thenReturn("Jean Dupont");

        ListingResponse result = listingService.getById(listingId);

        assertThat(result.getId()).isEqualTo(listingId);
        assertThat(result.getOwnerName()).isEqualTo("Jean Dupont");
    }

    @Test
    void getById_shouldThrowWhenNotFound() {
        when(listingRepository.findById(listingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> listingService.getById(listingId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void getMyListings_shouldReturnOwnerListings() {
        List<Listing> listings = List.of(sampleListing());
        when(listingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)).thenReturn(listings);

        List<ListingSummaryResponse> result = listingService.getMyListings(ownerId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Appartement lumineux");
    }
}
