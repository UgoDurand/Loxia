package com.loxia.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Loxia notification-service.
 *
 * <p>At this stage the application only boots the Spring context and
 * exposes the Actuator health endpoint. Notification CRUD and the
 * internal endpoint consumed by rental-service will be added in a
 * later step.</p>
 */
@SpringBootApplication
public class NotificationApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationApplication.class, args);
    }
}
