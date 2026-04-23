package com.trd.service;

import com.trd.dto.TradeRequest;
import com.trd.dto.TradeResponse;

import java.util.List;

public interface TradeService {
    TradeResponse executeTrade(Long userId, TradeRequest request);
    List<TradeResponse> getUserTrades(Long userId);
    List<TradeResponse> getUserTradesByDateRange(Long userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}
