package com.trd.controller;

import com.trd.dto.PredictionResponse;
import com.trd.entity.User;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.UserRepository;
import com.trd.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }

    @PostMapping("/stock/{stockId}")
    public ResponseEntity<PredictionResponse> createPrediction(
            @PathVariable Long stockId,
            @RequestParam(defaultValue = "1") int daysAhead,
            Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(predictionService.createPrediction(userId, stockId, daysAhead));
    }

    @GetMapping
    public ResponseEntity<List<PredictionResponse>> getUserPredictions(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        return ResponseEntity.ok(predictionService.getUserPredictions(userId));
    }

    @GetMapping("/stock/{stockId}")
    public ResponseEntity<List<PredictionResponse>> getStockPredictions(@PathVariable Long stockId) {
        return ResponseEntity.ok(predictionService.getStockPredictions(stockId));
    }
}
