package com.loxia.rental.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExternalListingResponse {
    private UUID id;
    private String title;
    private String city;
    private Integer price;
    private UUID ownerId;
}
