package com.loxia.catalog.dto;

import com.loxia.catalog.domain.Listing;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ListingSummaryResponse {

    private UUID id;
    private String title;
    private String propertyType;
    private String city;
    private Integer price;
    private Integer surface;
    private Integer rooms;
    private String photoUrl;
    private UUID ownerId;
    private boolean locked;

    public static ListingSummaryResponse from(Listing listing) {
        return from(listing, false);
    }

    public static ListingSummaryResponse from(Listing listing, boolean locked) {
        List<String> photos = listing.getPhotoUrls();
        String firstPhoto = (photos != null && !photos.isEmpty()) ? photos.get(0) : null;

        return ListingSummaryResponse.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .propertyType(listing.getPropertyType())
                .city(listing.getCity())
                .price(listing.getPrice())
                .surface(listing.getSurface())
                .rooms(listing.getRooms())
                .photoUrl(firstPhoto)
                .ownerId(listing.getOwnerId())
                .locked(locked)
                .build();
    }
}
