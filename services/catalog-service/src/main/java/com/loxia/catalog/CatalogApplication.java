package com.loxia.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Loxia catalog-service.
 *
 * <p>At this stage the application only boots the Spring context and
 * exposes the Actuator health endpoint. Listing CRUD, search filters
 * and cross-service enrichment/lock checks will be added in a later
 * step.</p>
 */
@SpringBootApplication
public class CatalogApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }
}
