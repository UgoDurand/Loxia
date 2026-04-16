package com.loxia.chat.config;

import com.loxia.chat.service.JwtExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.UUID;

/**
 * Validates the JWT token from the STOMP CONNECT frame.
 * The token is expected in the `Authorization` STOMP header: "Bearer <token>".
 * Sets a Principal on the session so downstream controllers can extract user identity.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtExtractor jwtExtractor;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtExtractor.isValid(token)) {
                    UUID userId = jwtExtractor.extractUserId(token);
                    String fullName = jwtExtractor.extractFullName(token);
                    accessor.setUser(new ChatPrincipal(userId, fullName));
                    log.debug("WebSocket CONNECT authenticated: userId={}", userId);
                } else {
                    log.warn("WebSocket CONNECT rejected: invalid JWT");
                    throw new IllegalArgumentException("Invalid JWT token");
                }
            } else {
                log.warn("WebSocket CONNECT rejected: missing Authorization header");
                throw new IllegalArgumentException("Missing Authorization header in STOMP CONNECT");
            }
        }
        return message;
    }

    public record ChatPrincipal(UUID userId, String fullName) implements Principal {
        @Override
        public String getName() {
            return userId.toString();
        }
    }
}
