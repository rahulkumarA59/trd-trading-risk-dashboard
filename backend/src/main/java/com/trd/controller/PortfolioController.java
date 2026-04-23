package com.trd.controller;

import com.trd.dto.PortfolioResponse;
import com.trd.entity.User;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.UserRepository;
import com.trd.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getUserPortfolio(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(portfolioService.getUserPortfolio(userId));
    }
}
