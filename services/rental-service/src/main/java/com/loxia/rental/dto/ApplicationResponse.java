package com.loxia.rental.dto;

import com.loxia.rental.domain.ApplicationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ApplicationResponse {
    private UUID id;
    private UUID listingId;
    private UUID applicantId;
    private Integer monthlyIncome;
    private String employmentStatus;
    private String message;
    private ApplicationStatus status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private String listingTitle;
    private String listingCity;
    private Integer listingPrice;
    private UUID listingOwnerId;

    private String applicantFullName;
    private String applicantEmail;
}
