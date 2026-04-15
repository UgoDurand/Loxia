package com.loxia.rental.controller;

import com.loxia.rental.dto.BatchLockRequest;
import com.loxia.rental.dto.BatchLockResponse;
import com.loxia.rental.dto.LockStatusResponse;
import com.loxia.rental.service.LockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/applications")
@RequiredArgsConstructor
public class InternalApplicationController {

    private final LockService lockService;

    @GetMapping("/listing/{id}/locked")
    public LockStatusResponse isListingLocked(@PathVariable UUID id) {
        return new LockStatusResponse(lockService.isListingLocked(id));
    }

    @PostMapping("/locks")
    public BatchLockResponse getLockStatuses(@Valid @RequestBody BatchLockRequest request) {
        return BatchLockResponse.builder()
                .locks(lockService.getLockStatuses(request.getListingIds()))
                .build();
    }
}
