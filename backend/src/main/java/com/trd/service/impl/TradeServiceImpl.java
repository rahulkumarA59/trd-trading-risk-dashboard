package com.trd.service.impl;

import com.trd.dto.TradeRequest;
import com.trd.dto.TradeResponse;
import com.trd.entity.Portfolio;
import com.trd.entity.Stock;
import com.trd.entity.Trade;
import com.trd.entity.User;
import com.trd.exception.BadRequestException;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.PortfolioRepository;
import com.trd.repository.StockRepository;
import com.trd.repository.TradeRepository;
import com.trd.repository.UserRepository;
import com.trd.service.TradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TradeServiceImpl implements TradeService {

    private static final String PORTFOLIO_CACHE = "portfolio";
    private static final String RISK_CACHE = "risk";

    private final TradeRepository tradeRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;

    @Override
    @Caching(evict = {
        @CacheEvict(value = PORTFOLIO_CACHE, allEntries = true),
        @CacheEvict(value = RISK_CACHE, allEntries = true)
    })
    @Transactional
    public TradeResponse executeTrade(Long userId, TradeRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Stock stock = stockRepository.findBySymbol(request.getSymbol())
            .orElseThrow(() -> new ResourceNotFoundException("Stock not found with symbol: " + request.getSymbol()));
        
        BigDecimal totalAmount = stock.getCurrentPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        
        Trade trade = new Trade();
        trade.setUser(user);
        trade.setStock(stock);
        trade.setQuantity(request.getQuantity());
        trade.setPrice(stock.getCurrentPrice());
        trade.setTotalAmount(totalAmount);
        
        if ("BUY".equalsIgnoreCase(request.getTradeType())) {
            trade.setTradeType(Trade.TradeType.BUY);
            
            if (user.getBalance() < totalAmount.doubleValue()) {
                throw new BadRequestException("Insufficient balance");
            }
            
            // Update user balance
            user.setBalance(user.getBalance() - totalAmount.doubleValue());
            userRepository.save(user);
            
            // Update or create portfolio
            Portfolio portfolio = portfolioRepository.findByUserIdAndStockId(userId, stock.getId())
                .orElse(null);
            
            if (portfolio == null) {
                portfolio = new Portfolio();
                portfolio.setUser(user);
                portfolio.setStock(stock);
                portfolio.setQuantity(request.getQuantity());
                portfolio.setAveragePrice(stock.getCurrentPrice());
                portfolio.setTotalInvested(totalAmount);
                portfolio.setCurrentValue(totalAmount);
            } else {
                BigDecimal newTotalInvested = portfolio.getTotalInvested().add(totalAmount);
                int newQuantity = portfolio.getQuantity() + request.getQuantity();
                BigDecimal newAvgPrice = newTotalInvested.divide(BigDecimal.valueOf(newQuantity), 2, java.math.RoundingMode.HALF_UP);
                
                portfolio.setQuantity(newQuantity);
                portfolio.setAveragePrice(newAvgPrice);
                portfolio.setTotalInvested(newTotalInvested);
                portfolio.setCurrentValue(BigDecimal.valueOf(newQuantity).multiply(stock.getCurrentPrice()));
            }
            
            portfolioRepository.save(portfolio);
            
        } else if ("SELL".equalsIgnoreCase(request.getTradeType())) {
            trade.setTradeType(Trade.TradeType.SELL);
            
            Portfolio portfolio = portfolioRepository.findByUserIdAndStockId(userId, stock.getId())
                .orElseThrow(() -> new BadRequestException("You don't own this stock"));
            
            if (portfolio.getQuantity() < request.getQuantity()) {
                throw new BadRequestException("Insufficient stocks to sell");
            }
            
            // Update user balance
            user.setBalance(user.getBalance() + totalAmount.doubleValue());
            userRepository.save(user);
            
            // Update portfolio
            int newQuantity = portfolio.getQuantity() - request.getQuantity();
            portfolio.setQuantity(newQuantity);
            
            BigDecimal soldAmount = stock.getCurrentPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
            portfolio.setTotalInvested(portfolio.getTotalInvested().subtract(soldAmount));
            portfolio.setCurrentValue(BigDecimal.valueOf(newQuantity).multiply(stock.getCurrentPrice()));
            
            if (newQuantity == 0) {
                portfolioRepository.delete(portfolio);
            } else {
                portfolioRepository.save(portfolio);
            }
        } else {
            throw new BadRequestException("Invalid trade type. Use BUY or SELL");
        }
        
        trade.setStatus(Trade.TradeStatus.COMPLETED);
        return mapToResponse(tradeRepository.save(trade));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TradeResponse> getUserTrades(Long userId) {
        return tradeRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TradeResponse> getUserTradesByDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return tradeRepository.findUserTradesByDateRange(userId, startDate, endDate).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private TradeResponse mapToResponse(Trade trade) {
        TradeResponse response = new TradeResponse();
        response.setId(trade.getId());
        response.setUserId(trade.getUser().getId());
        response.setStockId(trade.getStock().getId());
        response.setStockSymbol(trade.getStock().getSymbol());
        response.setStockName(trade.getStock().getName());
        response.setTradeType(trade.getTradeType().name());
        response.setQuantity(trade.getQuantity());
        response.setPrice(trade.getPrice());
        response.setTotalAmount(trade.getTotalAmount());
        response.setStatus(trade.getStatus().name());
        response.setCreatedAt(trade.getCreatedAt());
        return response;
    }
}
