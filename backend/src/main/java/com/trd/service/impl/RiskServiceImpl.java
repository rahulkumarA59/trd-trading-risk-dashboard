package com.trd.service.impl;

import com.trd.dto.RiskResponse;
import com.trd.entity.Portfolio;
import com.trd.repository.PortfolioRepository;
import com.trd.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

    private static final String RISK_CACHE = "risk";

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal VAR_90_FACTOR = new BigDecimal("1.28");
    private static final BigDecimal VAR_95_FACTOR = new BigDecimal("1.65");
    private static final BigDecimal VAR_99_FACTOR = new BigDecimal("2.33");

    private final PortfolioRepository portfolioRepository;

    @Override
    @Cacheable(value = RISK_CACHE, key = "#userId", sync = true)
    @Transactional(readOnly = true)
    public RiskResponse analyzeRisk(Long userId) {
        List<Portfolio> portfolios = portfolioRepository.findByUserId(userId);

        BigDecimal totalPortfolioValue = portfolios.stream()
            .map(this::calculateCurrentValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInvested = portfolios.stream()
            .map(Portfolio::getTotalInvested)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal volatility = calculateVolatility(portfolios);
        BigDecimal portfolioReturn = calculatePortfolioReturn(totalPortfolioValue, totalInvested);
        BigDecimal sharpeRatio = calculateSharpeRatio(portfolioReturn, volatility);
        BigDecimal maxDrawdown = calculateMaxDrawdown(totalPortfolioValue, totalInvested);
        BigDecimal diversificationScore = calculateDiversificationScore(portfolios);

        RiskResponse response = new RiskResponse();
        response.setTotalPortfolioValue(scale(totalPortfolioValue));
        response.setTotalInvested(scale(totalInvested));
        response.setVolatility(scale(volatility));
        response.setSharpeRatio(scale(sharpeRatio));
        response.setVar90(scale(totalPortfolioValue.multiply(volatility).multiply(VAR_90_FACTOR).divide(HUNDRED, 4, RoundingMode.HALF_UP)));
        response.setVar95(scale(totalPortfolioValue.multiply(volatility).multiply(VAR_95_FACTOR).divide(HUNDRED, 4, RoundingMode.HALF_UP)));
        response.setVar99(scale(totalPortfolioValue.multiply(volatility).multiply(VAR_99_FACTOR).divide(HUNDRED, 4, RoundingMode.HALF_UP)));
        response.setMaxDrawdown(scale(maxDrawdown));
        response.setDiversificationScore(scale(diversificationScore));
        response.setRiskLevel(determineRiskLevel(volatility, diversificationScore));
        return response;
    }

    private BigDecimal calculateCurrentValue(Portfolio portfolio) {
        if (portfolio.getStock() == null || portfolio.getStock().getCurrentPrice() == null) {
            return BigDecimal.ZERO;
        }
        return portfolio.getStock().getCurrentPrice().multiply(BigDecimal.valueOf(portfolio.getQuantity()));
    }

    private BigDecimal calculateVolatility(List<Portfolio> portfolios) {
        if (portfolios.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalVolatility = portfolios.stream()
            .map(this::calculatePositionVolatility)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalVolatility.divide(BigDecimal.valueOf(portfolios.size()), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePositionVolatility(Portfolio portfolio) {
        BigDecimal averagePrice = portfolio.getAveragePrice();
        BigDecimal currentPrice = portfolio.getStock() != null ? portfolio.getStock().getCurrentPrice() : null;

        if (averagePrice == null || currentPrice == null || averagePrice.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return currentPrice.subtract(averagePrice)
            .abs()
            .divide(averagePrice, 4, RoundingMode.HALF_UP)
            .multiply(HUNDRED);
    }

    private BigDecimal calculatePortfolioReturn(BigDecimal totalPortfolioValue, BigDecimal totalInvested) {
        if (totalInvested.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return totalPortfolioValue.subtract(totalInvested)
            .divide(totalInvested, 4, RoundingMode.HALF_UP)
            .multiply(HUNDRED);
    }

    private BigDecimal calculateSharpeRatio(BigDecimal portfolioReturn, BigDecimal volatility) {
        if (volatility.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal riskFreeRate = BigDecimal.valueOf(2);
        return portfolioReturn.subtract(riskFreeRate)
            .divide(volatility, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateMaxDrawdown(BigDecimal totalPortfolioValue, BigDecimal totalInvested) {
        if (totalInvested.compareTo(BigDecimal.ZERO) == 0 || totalPortfolioValue.compareTo(totalInvested) >= 0) {
            return BigDecimal.ZERO;
        }

        return totalInvested.subtract(totalPortfolioValue)
            .divide(totalInvested, 4, RoundingMode.HALF_UP)
            .multiply(HUNDRED);
    }

    private BigDecimal calculateDiversificationScore(List<Portfolio> portfolios) {
        if (portfolios.isEmpty()) {
            return BigDecimal.ZERO;
        }

        long distinctStocks = portfolios.stream()
            .map(Portfolio::getStock)
            .filter(stock -> stock != null && stock.getId() != null)
            .map(stock -> stock.getId())
            .distinct()
            .count();

        BigDecimal score = BigDecimal.valueOf(distinctStocks)
            .multiply(BigDecimal.valueOf(20));

        return score.min(HUNDRED);
    }

    private String determineRiskLevel(BigDecimal volatility, BigDecimal diversificationScore) {
        if (volatility.compareTo(BigDecimal.valueOf(25)) > 0 || diversificationScore.compareTo(BigDecimal.valueOf(40)) < 0) {
            return "HIGH";
        }
        if (volatility.compareTo(BigDecimal.valueOf(12)) > 0 || diversificationScore.compareTo(BigDecimal.valueOf(60)) < 0) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
