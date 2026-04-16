package com.loxia.catalog.domain;

import com.loxia.catalog.config.StringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "listings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "property_type", nullable = false, length = 50)
    private String propertyType;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false)
    private Integer surface;

    @Column(nullable = false)
    private Integer rooms;

    @Column(name = "photo_urls", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> photoUrls;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    private List<String> amenities;

    private Integer floor;

    @Column(name = "energy_class", length = 1)
    private String energyClass;

    private Integer deposit;

    private Double latitude;

    private Double longitude;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
