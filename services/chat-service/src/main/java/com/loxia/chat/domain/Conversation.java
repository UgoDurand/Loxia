package com.loxia.chat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "conversations",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_conversation",
        columnNames = {"listing_id", "tenant_id"}
    )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "listing_title", nullable = false)
    private String listingTitle;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "owner_name", nullable = false)
    private String ownerName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @PrePersist
    void prePersist() {
        createdAt = updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
