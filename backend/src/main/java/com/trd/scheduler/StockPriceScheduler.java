package com.trd.scheduler;

import com.trd.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler component for automatically updating stock prices at regular intervals.
 * Fetches live prices from external API and updates the database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StockPriceScheduler {

    private final StockService stockService;

    /**
     * Scheduled task to update all stock prices every minute.
     * Runs at fixed rate of 60000 milliseconds (1 minute).
     * 
     * This method:
     * 1. Fetches all stocks from database
     * 2. For each stock, retrieves live price from API
     * 3. Updates previous price with current price
     * 4. Sets new current price
     * 5. Saves updated stock to database
     * 6. Handles API failures gracefully with logging
     */
    @Scheduled(
            fixedRateString = "${stock.scheduler.fixed-rate:60000}",
            initialDelayString = "${stock.scheduler.initial-delay:10000}"
    )
    public void updateAllStockPrices() {
        try {
            log.info("Starting scheduled stock price update");
            boolean updated = stockService.updateAllStocksWithLivePrices();
            if (updated) {
                log.info("Scheduled stock price update completed with at least one successful refresh");
            } else {
                log.info("Scheduled stock price update completed without any successful refresh");
            }
        } catch (Exception e) {
            log.error("Unexpected error in scheduled stock price update: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual method to update a specific stock price.
     * Can be called from service layer without waiting for scheduler.
     *
     * @param symbol the stock symbol to update
     * @return true if update was successful, false otherwise
     */
    public boolean updateStockPriceManual(String symbol) {
        try {
            return stockService.updateStockWithLivePrice(symbol).isPresent();

        } catch (Exception e) {
            log.error("Error manually updating price for symbol: {}. Error: {}", symbol, e.getMessage(), e);
            return false;
        }
    }
}

