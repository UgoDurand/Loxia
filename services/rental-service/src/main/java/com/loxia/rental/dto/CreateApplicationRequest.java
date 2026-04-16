package com.loxia.rental.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateApplicationRequest {

    @NotNull(message = "Listing id is required")
    private UUID listingId;

    @NotNull(message = "Monthly income is required")
    @PositiveOrZero(message = "Monthly income must be positive or zero")
    private Integer monthlyIncome;

    @NotBlank(message = "Employment status is required")
    @Size(max = 50)
    private String employmentStatus;

    @Size(max = 2000)
    private String message;

    @FutureOrPresent(message = "Start date must be today or later")
    private LocalDate startDate;

    private LocalDate endDate;
}
