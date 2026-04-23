package com.trd.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskResponse {
    private BigDecimal totalPortfolioValue;
    private BigDecimal totalInvested;
    private BigDecimal volatility;
    private BigDecimal sharpeRatio;
    private BigDecimal var90;
    private BigDecimal var95;
    private BigDecimal var99;
    private BigDecimal maxDrawdown;
    private BigDecimal diversificationScore;
    private String riskLevel;
}

