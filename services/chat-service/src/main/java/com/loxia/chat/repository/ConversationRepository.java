package com.loxia.chat.repository;

import com.loxia.chat.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByListingIdAndTenantId(UUID listingId, UUID tenantId);

    List<Conversation> findByTenantIdOrOwnerIdOrderByUpdatedAtDesc(UUID tenantId, UUID ownerId);
}
