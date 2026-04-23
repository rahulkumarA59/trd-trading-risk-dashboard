package com.trd.controller;

import com.trd.dto.TradeRequest;
import com.trd.dto.TradeResponse;
import com.trd.entity.User;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.UserRepository;
import com.trd.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }

    @PostMapping
    public ResponseEntity<TradeResponse> executeTrade(@Valid @RequestBody TradeRequest request, Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(tradeService.executeTrade(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<TradeResponse>> getUserTrades(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(tradeService.getUserTrades(userId));
    }
}
