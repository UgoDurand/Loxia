package com.loxia.catalog.controller;

import com.loxia.catalog.dto.*;
import com.loxia.catalog.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;

    @GetMapping
    public List<ListingSummaryResponse> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String propertyType,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate availableFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate availableTo) {
        return listingService.search(city, propertyType, minPrice, maxPrice, availableFrom, availableTo);
    }

    @GetMapping("/mine")
    public List<ListingSummaryResponse> myListings(
            @RequestHeader("X-User-Id") UUID userId) {
        return listingService.getMyListings(userId);
    }

    @GetMapping("/{id:[0-9a-f\\-]{36}}")
    public ListingResponse getById(@PathVariable UUID id) {
        return listingService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingResponse create(
            @Valid @RequestBody CreateListingRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        return listingService.create(request, userId);
    }

    @PutMapping("/{id:[0-9a-f\\-]{36}}")
    public ListingResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateListingRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        return listingService.update(id, request, userId);
    }

    @DeleteMapping("/{id:[0-9a-f\\-]{36}}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        listingService.delete(id, userId);
    }
}
