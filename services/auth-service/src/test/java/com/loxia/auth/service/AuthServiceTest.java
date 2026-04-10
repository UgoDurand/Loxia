package com.loxia.auth.service;

import com.loxia.auth.domain.User;
import com.loxia.auth.dto.LoginRequest;
import com.loxia.auth.dto.RegisterRequest;
import com.loxia.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;

    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        // Inject real PasswordEncoder via reflection (not a Spring context test)
        org.springframework.test.util.ReflectionTestUtils.setField(
                authService, "passwordEncoder", passwordEncoder);
    }

    @Test
    void register_withDuplicateEmail_throwsConflict() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("password123");
        request.setFullName("Alice");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_withNewEmail_savesUserAndReturnsTokens() {
        when(userRepository.existsByEmail("bob@example.com")).thenReturn(false);
        User saved = User.builder()
                .id(UUID.randomUUID())
                .email("bob@example.com")
                .fullName("Bob")
                .passwordHash("hashed")
                .build();
        when(userRepository.save(any())).thenReturn(saved);
        when(jwtService.generateAccessToken(saved)).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(saved)).thenReturn("refresh-token");

        RegisterRequest request = new RegisterRequest();
        request.setEmail("bob@example.com");
        request.setPassword("password123");
        request.setFullName("Bob");

        var response = authService.register(request);

        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getUser().getEmail()).isEqualTo("bob@example.com");
    }

    @Test
    void login_withWrongPassword_throwsUnauthorized() {
        String hash = passwordEncoder.encode("correct-password");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("alice@example.com")
                .passwordHash(hash)
                .fullName("Alice")
                .build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("wrong-password");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void login_withUnknownEmail_throwsUnauthorized() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("any-password");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }
}
