package com.trd.service.impl;

import com.trd.dto.PortfolioResponse;
import com.trd.entity.Portfolio;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.PortfolioRepository;
import com.trd.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioServiceImpl implements PortfolioService {

    private static final String PORTFOLIO_CACHE = "portfolio";

    private final PortfolioRepository portfolioRepository;

    @Override
    @Cacheable(value = PORTFOLIO_CACHE, key = "#userId", sync = true)
    @Transactional(readOnly = true)
    public List<PortfolioResponse> getUserPortfolio(Long userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserId(userId);
        
        return portfolios.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = PORTFOLIO_CACHE, key = "'id:' + #id", sync = true)
    @Transactional(readOnly = true)
    public PortfolioResponse getPortfolioById(Long id) {
        Portfolio portfolio = portfolioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + id));
        
        return mapToResponse(portfolio);
    }
    
    private PortfolioResponse mapToResponse(Portfolio portfolio) {
        PortfolioResponse response = new PortfolioResponse();
        response.setId(portfolio.getId());
        response.setUserId(portfolio.getUser().getId());
        response.setStockId(portfolio.getStock().getId());
        response.setStockSymbol(portfolio.getStock().getSymbol());
        response.setStockName(portfolio.getStock().getName());
        response.setQuantity(portfolio.getQuantity());
        response.setAveragePrice(portfolio.getAveragePrice());
        response.setTotalInvested(portfolio.getTotalInvested());
        
        // Calculate current value
        BigDecimal currentValue = BigDecimal.valueOf(portfolio.getQuantity())
            .multiply(portfolio.getStock().getCurrentPrice());
        response.setCurrentValue(currentValue);
        
        // Calculate profit/loss
        BigDecimal profitLoss = currentValue.subtract(portfolio.getTotalInvested());
        response.setProfitLoss(profitLoss);
        
        // Calculate profit/loss percentage
        if (portfolio.getTotalInvested().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal profitLossPercentage = profitLoss
                .divide(portfolio.getTotalInvested(), 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            response.setProfitLossPercentage(profitLossPercentage);
        } else {
            response.setProfitLossPercentage(BigDecimal.ZERO);
        }
        
        return response;
    }
}
