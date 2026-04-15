package com.loxia.rental.repository;

import com.loxia.rental.domain.Application;
import com.loxia.rental.domain.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    List<Application> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId);

    List<Application> findByListingIdInOrderByCreatedAtDesc(Collection<UUID> listingIds);

    boolean existsByListingIdAndApplicantIdAndStatusIn(UUID listingId, UUID applicantId, Collection<ApplicationStatus> statuses);

    boolean existsByListingIdAndStatusIn(UUID listingId, Collection<ApplicationStatus> statuses);

    @Query("select distinct a.listingId from Application a where a.listingId in :listingIds and a.status in :statuses")
    List<UUID> findLockedListingIds(@Param("listingIds") Collection<UUID> listingIds,
                                    @Param("statuses") Collection<ApplicationStatus> statuses);
}
