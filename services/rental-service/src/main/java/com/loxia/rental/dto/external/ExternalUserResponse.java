package com.loxia.rental.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExternalUserResponse {
    private UUID id;
    private String email;
    private String fullName;
}
