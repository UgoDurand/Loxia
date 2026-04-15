package com.loxia.auth.controller;

import com.loxia.auth.dto.UserResponse;
import com.loxia.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final AuthService authService;

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable UUID id) {
        return authService.getProfileById(id);
    }
}
