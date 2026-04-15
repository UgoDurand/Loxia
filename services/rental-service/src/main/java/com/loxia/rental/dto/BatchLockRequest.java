package com.loxia.rental.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BatchLockRequest {

    @NotEmpty(message = "listingIds must not be empty")
    private List<UUID> listingIds;
}
