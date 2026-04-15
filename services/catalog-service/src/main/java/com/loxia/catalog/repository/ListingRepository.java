package com.loxia.catalog.repository;

import com.loxia.catalog.domain.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID>,
        JpaSpecificationExecutor<Listing> {

    List<Listing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
