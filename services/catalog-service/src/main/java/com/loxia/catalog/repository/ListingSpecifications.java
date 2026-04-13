package com.loxia.catalog.repository;

import com.loxia.catalog.domain.Listing;
import org.springframework.data.jpa.domain.Specification;

public final class ListingSpecifications {

    private ListingSpecifications() {
    }

    public static Specification<Listing> cityContains(String city) {
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase() + "%");
    }

    public static Specification<Listing> propertyTypeEquals(String propertyType) {
        return (root, query, cb) ->
                cb.equal(cb.lower(root.get("propertyType")), propertyType.toLowerCase());
    }

    public static Specification<Listing> priceMax(Integer maxPrice) {
        return (root, query, cb) ->
                cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Listing> priceMin(Integer minPrice) {
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }
}
