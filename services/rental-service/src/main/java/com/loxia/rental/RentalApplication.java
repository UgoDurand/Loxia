package com.loxia.rental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Loxia rental-service.
 *
 * <p>At this stage the application only boots the Spring context and
 * exposes the Actuator health endpoint. Application CRUD, lock rule
 * and notification triggers will be added in a later step.</p>
 */
@SpringBootApplication
public class RentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentalApplication.class, args);
    }
}
