package com.trd.service.impl;

import com.trd.dto.StockResponse;
import com.trd.entity.Stock;
import com.trd.exception.ResourceNotFoundException;
import com.trd.repository.StockRepository;
import com.trd.service.ExternalStockApiService;
import com.trd.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService {

    private static final String STOCKS_CACHE = "stocks";
    private static final String PORTFOLIO_CACHE = "portfolio";
    private static final String RISK_CACHE = "risk";

    private final StockRepository stockRepository;
    private final ExternalStockApiService externalStockApiService;

    @Override
    @Cacheable(value = STOCKS_CACHE, key = "'all'", sync = true)
    @Transactional(readOnly = true)
    public List<StockResponse> getAllStocks() {
        return stockRepository.findAll().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = STOCKS_CACHE, key = "'id:' + #id", sync = true)
    @Transactional(readOnly = true)
    public StockResponse getStockById(Long id) {
        Stock stock = stockRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));
        return mapToResponse(stock);
    }

    @Override
    @Cacheable(value = STOCKS_CACHE, key = "'symbol:' + #symbol.toUpperCase()", sync = true)
    @Transactional(readOnly = true)
    public StockResponse getStockBySymbol(String symbol) {
        Stock stock = stockRepository.findBySymbol(symbol)
            .orElseThrow(() -> new ResourceNotFoundException("Stock not found with symbol: " + symbol));
        return mapToResponse(stock);
    }

    @Override
    @Cacheable(value = STOCKS_CACHE, key = "'search:' + (#query == null ? '' : #query.trim().toLowerCase())", sync = true)
    @Transactional(readOnly = true)
    public List<StockResponse> searchStocks(String query) {
        return stockRepository.searchStocks(query).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = STOCKS_CACHE, allEntries = true)
    @Transactional
    public StockResponse createStock(Stock stock) {
        Stock savedStock = stockRepository.save(stock);
        return mapToResponse(savedStock);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = STOCKS_CACHE, allEntries = true),
        @CacheEvict(value = PORTFOLIO_CACHE, allEntries = true),
        @CacheEvict(value = RISK_CACHE, allEntries = true)
    })
    @Transactional
    public StockResponse updateStock(Long id, Stock stock) {
        Stock existingStock = stockRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));
        
        existingStock.setName(stock.getName());
        existingStock.setCurrentPrice(stock.getCurrentPrice());
        existingStock.setPreviousPrice(stock.getPreviousPrice());
        existingStock.setMarketCap(stock.getMarketCap());
        existingStock.setVolume(stock.getVolume());
        existingStock.setSector(stock.getSector());
        existingStock.setDescription(stock.getDescription());
        
        Stock updatedStock = stockRepository.save(existingStock);
        return mapToResponse(updatedStock);
    }

    @Override
    @Caching(evict = {
        @CacheEvict(value = STOCKS_CACHE, allEntries = true),
        @CacheEvict(value = PORTFOLIO_CACHE, allEntries = true),
        @CacheEvict(value = RISK_CACHE, allEntries = true)
    })
    @Transactional
    public void deleteStock(Long id) {
        if (!stockRepository.existsById(id)) {
            throw new ResourceNotFoundException("Stock not found with id: " + id);
        }
        stockRepository.deleteById(id);
    }

    /**
     * Updates a stock with live price data from external API.
     * Stores previous price before updating current price.
     *
     * @param symbol the stock symbol to update
     * @return Optional containing updated StockResponse if successful
     */
    @Caching(evict = {
        @CacheEvict(value = STOCKS_CACHE, allEntries = true),
        @CacheEvict(value = PORTFOLIO_CACHE, allEntries = true),
        @CacheEvict(value = RISK_CACHE, allEntries = true)
    })
    @Transactional
    public Optional<StockResponse> updateStockWithLivePrice(String symbol) {
        try {
            Optional<Stock> stockOptional = stockRepository.findBySymbol(symbol);
            if (stockOptional.isEmpty()) {
                log.warn("Stock not found with symbol: {}", symbol);
                return Optional.empty();
            }

            Stock stock = stockOptional.get();
            Optional<BigDecimal> livePrice = externalStockApiService.getLiveStockPrice(symbol);

            if (livePrice.isPresent()) {
                applyLivePrice(stock, livePrice.get());
                Stock updatedStock = stockRepository.save(stock);

                log.info("Updated live price for symbol: {}. New price: {}, Previous price: {}",
                    symbol, livePrice.get(), stock.getPreviousPrice());

                return Optional.of(mapToResponse(updatedStock));
            }

            log.warn("No live price available for symbol: {}. Falling back to stored price {}.",
                symbol, stock.getCurrentPrice());
            return Optional.of(mapToResponse(stock));

        } catch (Exception e) {
            log.error("Error updating live price for symbol: {}. Error: {}", symbol, e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Updates all stocks with live prices from external API.
     * This method is typically called by the scheduler.
     *
     * @return true if at least one stock was updated successfully
     */
    @Caching(evict = {
        @CacheEvict(value = STOCKS_CACHE, allEntries = true),
        @CacheEvict(value = PORTFOLIO_CACHE, allEntries = true),
        @CacheEvict(value = RISK_CACHE, allEntries = true)
    })
    @Transactional
    public boolean updateAllStocksWithLivePrices() {
        try {
            List<Stock> stocks = stockRepository.findAll();

            if (stocks.isEmpty()) {
                log.info("No stocks found in database. Skipping price update.");
                return false;
            }

            log.info("Starting to update live prices for {} stocks", stocks.size());
            int successCount = 0;
            int failureCount = 0;
            List<Stock> stocksToSave = new ArrayList<>();

            for (Stock stock : stocks) {
                try {
                    Optional<BigDecimal> livePrice = externalStockApiService.getLiveStockPrice(stock.getSymbol());

                    if (livePrice.isPresent()) {
                        applyLivePrice(stock, livePrice.get());
                        stocksToSave.add(stock);
                        successCount++;

                        log.debug("Updated price for symbol: {}. New price: {}", stock.getSymbol(), livePrice.get());
                    } else {
                        failureCount++;
                        log.debug("No live price available for symbol: {}. Keeping stored price {}.",
                            stock.getSymbol(), stock.getCurrentPrice());
                    }
                } catch (Exception e) {
                    failureCount++;
                    log.warn("Failed to update price for symbol: {}. Error: {}", stock.getSymbol(), e.getMessage());
                }
            }

            if (!stocksToSave.isEmpty()) {
                stockRepository.saveAll(stocksToSave);
            }

            log.info("Completed live price update. Success: {}, Failures: {}", successCount, failureCount);
            return successCount > 0;

        } catch (Exception e) {
            log.error("Unexpected error updating all stock prices: {}", e.getMessage(), e);
            return false;
        }
    }

    private void applyLivePrice(Stock stock, BigDecimal livePrice) {
        BigDecimal currentPrice = stock.getCurrentPrice();
        stock.setPreviousPrice(currentPrice != null ? currentPrice : livePrice);
        stock.setCurrentPrice(livePrice);
    }

    private StockResponse mapToResponse(Stock stock) {
        StockResponse response = new StockResponse();
        response.setId(stock.getId());
        response.setSymbol(stock.getSymbol());
        response.setName(stock.getName());
        response.setCurrentPrice(stock.getCurrentPrice());
        response.setPreviousPrice(stock.getPreviousPrice());
        response.setMarketCap(stock.getMarketCap());
        response.setVolume(stock.getVolume());
        response.setSector(stock.getSector());
        response.setDescription(stock.getDescription());
        response.setCreatedAt(stock.getCreatedAt());
        response.setUpdatedAt(stock.getUpdatedAt());
        return response;
    }
}
