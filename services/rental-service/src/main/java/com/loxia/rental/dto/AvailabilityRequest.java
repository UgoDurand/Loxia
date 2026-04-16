package com.loxia.rental.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class AvailabilityRequest {

    @NotEmpty
    private List<UUID> listingIds;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
