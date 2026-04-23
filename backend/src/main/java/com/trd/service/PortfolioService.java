package com.trd.service;

import com.trd.dto.PortfolioResponse;

import java.util.List;

public interface PortfolioService {
    List<PortfolioResponse> getUserPortfolio(Long userId);
    PortfolioResponse getPortfolioById(Long id);
}

