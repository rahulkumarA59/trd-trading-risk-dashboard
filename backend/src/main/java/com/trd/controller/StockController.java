package com.trd.controller;

import com.trd.dto.StockResponse;
import com.trd.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ResponseEntity<List<StockResponse>> getAllStocks() {
        return ResponseEntity.ok(stockService.getAllStocks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockResponse> getStockById(@PathVariable Long id) {
        return ResponseEntity.ok(stockService.getStockById(id));
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<StockResponse> getStockBySymbol(@PathVariable String symbol) {
        return ResponseEntity.ok(stockService.getStockBySymbol(symbol));
    }

    @GetMapping("/search")
    public ResponseEntity<List<StockResponse>> searchStocks(@RequestParam String query) {
        return ResponseEntity.ok(stockService.searchStocks(query));
    }

    /**
     * Manually update a stock with live price from external API.
     * Endpoint: GET /api/stocks/update-price/{symbol}
     *
     * @param symbol the stock symbol to update
     * @return ResponseEntity containing updated stock data or 404 if not found
     */
    @GetMapping("/update-price/{symbol}")
    public ResponseEntity<?> updateStockPrice(@PathVariable String symbol) {
        Optional<StockResponse> updatedStock = stockService.updateStockWithLivePrice(symbol);
        return updatedStock.isPresent()
            ? ResponseEntity.ok(updatedStock.get())
            : ResponseEntity.notFound().build();
    }

    /**
     * Manually trigger update of all stock prices.
     * Endpoint: POST /api/stocks/update-all-prices
     *
     * @return ResponseEntity with success status
     */
    @PostMapping("/update-all-prices")
    public ResponseEntity<String> updateAllStockPrices() {
        boolean success = stockService.updateAllStocksWithLivePrices();
        return ResponseEntity.ok(success
            ? "{\"message\": \"Stock prices updated successfully\"}"
            : "{\"message\": \"No stocks were successfully updated\"}");
    }
}
