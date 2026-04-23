package com.trd.controller;

import com.trd.dto.RiskResponse;
import com.trd.entity.User;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.UserRepository;
import com.trd.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    private final RiskService riskService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<RiskResponse> analyzeRisk(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(riskService.analyzeRisk(userId));
    }
}
