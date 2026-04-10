package com.loxia.auth.service;

import com.loxia.auth.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        // Secret must be at least 32 chars for HS256
        jwtService = new JwtService("test-secret-that-is-long-enough-for-hs256");
        user = User.builder()
                .id(UUID.randomUUID())
                .email("alice@example.com")
                .fullName("Alice Dupont")
                .passwordHash("hashed")
                .build();
    }

    @Test
    void generateAccessToken_returnsNonBlankToken() {
        String token = jwtService.generateAccessToken(user);
        assertThat(token).isNotBlank();
    }

    @Test
    void extractUserId_returnsCorrectId() {
        String token = jwtService.generateAccessToken(user);
        assertThat(jwtService.extractUserId(token)).isEqualTo(user.getId());
    }

    @Test
    void extractEmail_returnsCorrectEmail() {
        String token = jwtService.generateAccessToken(user);
        assertThat(jwtService.extractEmail(token)).isEqualTo("alice@example.com");
    }

    @Test
    void isTokenValid_returnsTrueForFreshToken() {
        String token = jwtService.generateAccessToken(user);
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForTamperedToken() {
        String token = jwtService.generateAccessToken(user) + "tampered";
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForRandomString() {
        assertThat(jwtService.isTokenValid("not.a.jwt")).isFalse();
    }
}
