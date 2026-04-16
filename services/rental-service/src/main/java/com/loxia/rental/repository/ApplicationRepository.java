package com.loxia.rental.repository;

import com.loxia.rental.domain.Application;
import com.loxia.rental.domain.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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

    /**
     * Returns true if a listing already has an ACCEPTED application whose date range
     * overlaps [startDate, endDate]. Two ranges overlap when start1 <= end2 AND start2 <= end1.
     * Only applications with both dates set are considered.
     */
    @Query("""
            select count(a) > 0 from Application a
            where a.listingId = :listingId
              and a.status = com.loxia.rental.domain.ApplicationStatus.ACCEPTED
              and a.startDate is not null
              and a.endDate   is not null
              and a.startDate <= :endDate
              and a.endDate   >= :startDate
            """)
    boolean existsOverlappingAcceptedApplication(
            @Param("listingId")  UUID      listingId,
            @Param("startDate")  LocalDate startDate,
            @Param("endDate")    LocalDate endDate);

    /**
     * Batch version: returns listing IDs from the given set that already have an
     * ACCEPTED application overlapping [startDate, endDate].
     */
    @Query("""
            select distinct a.listingId from Application a
            where a.listingId in :listingIds
              and a.status = com.loxia.rental.domain.ApplicationStatus.ACCEPTED
              and a.startDate is not null
              and a.endDate   is not null
              and a.startDate <= :endDate
              and a.endDate   >= :startDate
            """)
    List<UUID> findUnavailableListingIds(
            @Param("listingIds") Collection<UUID> listingIds,
            @Param("startDate")  LocalDate         startDate,
            @Param("endDate")    LocalDate         endDate);
}
