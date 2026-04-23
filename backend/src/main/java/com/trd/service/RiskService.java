package com.trd.service;

import com.trd.dto.RiskResponse;

public interface RiskService {
    RiskResponse analyzeRisk(Long userId);
}

