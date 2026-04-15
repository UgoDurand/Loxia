package com.loxia.rental.controller;

import com.loxia.rental.dto.ApplicationResponse;
import com.loxia.rental.dto.CreateApplicationRequest;
import com.loxia.rental.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationResponse create(
            @Valid @RequestBody CreateApplicationRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        return applicationService.create(userId, request);
    }

    @GetMapping("/mine")
    public List<ApplicationResponse> mine(@RequestHeader("X-User-Id") UUID userId) {
        return applicationService.getMyApplications(userId);
    }

    @GetMapping("/received")
    public List<ApplicationResponse> received(@RequestHeader("X-User-Id") UUID userId) {
        return applicationService.getReceivedApplications(userId);
    }

    @PostMapping("/{id}/accept")
    public ApplicationResponse accept(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        return applicationService.accept(id, userId);
    }

    @PostMapping("/{id}/reject")
    public ApplicationResponse reject(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        return applicationService.reject(id, userId);
    }
}
