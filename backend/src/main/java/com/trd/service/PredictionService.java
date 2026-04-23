package com.trd.service;

import com.trd.dto.PredictionResponse;

import java.util.List;

public interface PredictionService {
    PredictionResponse createPrediction(Long userId, Long stockId, int daysAhead);
    List<PredictionResponse> getUserPredictions(Long userId);
    List<PredictionResponse> getStockPredictions(Long stockId);
}

