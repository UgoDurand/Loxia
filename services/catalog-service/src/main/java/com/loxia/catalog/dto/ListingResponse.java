package com.loxia.catalog.dto;

import com.loxia.catalog.domain.Listing;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ListingResponse {

    private UUID id;
    private String title;
    private String description;
    private String propertyType;
    private String city;
    private Integer price;
    private Integer surface;
    private Integer rooms;
    private List<String> photoUrls;
    private List<String> amenities;
    private Integer floor;
    private String energyClass;
    private Integer deposit;
    private UUID ownerId;
    private String ownerName;
    private boolean locked;
    private Double lat;
    private Double lng;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ListingResponse from(Listing listing) {
        return from(listing, null, false);
    }

    public static ListingResponse from(Listing listing, String ownerName) {
        return from(listing, ownerName, false);
    }

    public static ListingResponse from(Listing listing, String ownerName, boolean locked) {
        return ListingResponse.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .propertyType(listing.getPropertyType())
                .city(listing.getCity())
                .price(listing.getPrice())
                .surface(listing.getSurface())
                .rooms(listing.getRooms())
                .photoUrls(listing.getPhotoUrls())
                .amenities(listing.getAmenities() != null ? listing.getAmenities() : List.of())
                .floor(listing.getFloor())
                .energyClass(listing.getEnergyClass())
                .deposit(listing.getDeposit())
                .ownerId(listing.getOwnerId())
                .ownerName(ownerName)
                .locked(locked)
                .lat(listing.getLatitude())
                .lng(listing.getLongitude())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
