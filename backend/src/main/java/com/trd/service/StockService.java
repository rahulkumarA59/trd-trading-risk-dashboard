package com.trd.service;

import com.trd.dto.StockResponse;
import com.trd.entity.Stock;

import java.util.List;
import java.util.Optional;

public interface StockService {
    List<StockResponse> getAllStocks();
    StockResponse getStockById(Long id);
    StockResponse getStockBySymbol(String symbol);
    List<StockResponse> searchStocks(String query);
    StockResponse createStock(Stock stock);
    StockResponse updateStock(Long id, Stock stock);
    void deleteStock(Long id);
    Optional<StockResponse> updateStockWithLivePrice(String symbol);
    boolean updateAllStocksWithLivePrices();
}

