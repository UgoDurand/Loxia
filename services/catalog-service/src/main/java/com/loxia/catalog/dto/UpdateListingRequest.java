package com.loxia.catalog.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class UpdateListingRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    private String description;

    @NotBlank(message = "Property type is required")
    @Size(max = 50)
    private String propertyType;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Integer price;

    @NotNull(message = "Surface is required")
    @Positive(message = "Surface must be positive")
    private Integer surface;

    @NotNull(message = "Rooms is required")
    @Positive(message = "Rooms must be positive")
    private Integer rooms;

    private List<String> photoUrls;

    private List<String> amenities;

    private Integer floor;

    @Size(max = 1)
    private String energyClass;

    @PositiveOrZero(message = "Deposit must be zero or positive")
    private Integer deposit;
}
