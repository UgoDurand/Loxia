package com.loxia.catalog.controller;

import com.loxia.catalog.dto.ListingResponse;
import com.loxia.catalog.dto.ListingSummaryResponse;
import com.loxia.catalog.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/internal/listings")
@RequiredArgsConstructor
public class InternalListingController {

    private final ListingService listingService;

    @GetMapping("/{id}")
    public ListingResponse getById(@PathVariable UUID id) {
        return listingService.getById(id);
    }

    @GetMapping("/owner/{ownerId}")
    public List<ListingSummaryResponse> getByOwner(@PathVariable UUID ownerId) {
        return listingService.getMyListings(ownerId);
    }
}
