package com.loxia.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Loxia auth-service.
 *
 * <p>At this stage the application only boots the Spring context and
 * exposes the Actuator health endpoint. Business endpoints (register,
 * login, JWT issuance, profile management) will be added in a later
 * step.</p>
 */
@SpringBootApplication
public class AuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
