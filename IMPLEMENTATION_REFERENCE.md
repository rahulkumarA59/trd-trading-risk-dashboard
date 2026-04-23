# Stock Price Integration - Implementation Reference

## Complete Code Components

### 1. TrdApplication.java (UPDATED)
**Location:** `backend/src/main/java/com/trd/TrdApplication.java`
**Key Changes:** Added `@EnableScheduling` annotation

```java
package com.trd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling  // ← ADDED: Enables scheduled task execution
public class TrdApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrdApplication.class, args);
    }
}
```

---

### 2. ExternalStockApiService.java (ALREADY EXISTS)
**Location:** `backend/src/main/java/com/trd/service/ExternalStockApiService.java`

**Key Methods:**
- `getLiveStockPrice(String symbol)` → `Optional<BigDecimal>`
- `getLiveStockData(String symbol)` → `Optional<StockData>`

**Features:**
- Alpha Vantage API integration
- JSON parsing with Jackson
- Error handling and logging
- Rate limit detection

---

### 3. StockServiceImpl.java (UPDATED)
**Location:** `backend/src/main/java/com/trd/service/impl/StockServiceImpl.java`

**New Methods Added:**

```java
/**
 * Updates a stock with live price data from external API.
 * Stores previous price before updating current price.
 *
 * @param symbol the stock symbol to update
 * @return Optional containing updated StockResponse if successful
 */
@Transactional
public Optional<StockResponse> updateStockWithLivePrice(String symbol) {
    try {
        Stock stock = stockRepository.findBySymbol(symbol).orElse(null);
        if (stock == null) {
            log.warn("Stock not found with symbol: {}", symbol);
            return Optional.empty();
        }

        Optional<BigDecimal> livePrice = externalStockApiService.getLiveStockPrice(symbol);

        if (livePrice.isPresent()) {
            stock.setPreviousPrice(stock.getCurrentPrice());
            stock.setCurrentPrice(livePrice.get());
            Stock updatedStock = stockRepository.save(stock);
            log.info("Updated live price for symbol: {}. New price: {}", 
                symbol, livePrice.get());
            return Optional.of(mapToResponse(updatedStock));
        } else {
            log.warn("No live price available for symbol: {}", symbol);
            return Optional.empty();
        }
    } catch (Exception e) {
        log.error("Error updating live price for symbol: {}. Error: {}", 
            symbol, e.getMessage(), e);
        return Optional.empty();
    }
}
```

```java
/**
 * Updates all stocks with live prices from external API.
 * This method is typically called by the scheduler.
 *
 * @return true if at least one stock was updated successfully
 */
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

        for (Stock stock : stocks) {
            try {
                Optional<BigDecimal> livePrice = externalStockApiService
                    .getLiveStockPrice(stock.getSymbol());
                
                if (livePrice.isPresent()) {
                    stock.setPreviousPrice(stock.getCurrentPrice());
                    stock.setCurrentPrice(livePrice.get());
                    stockRepository.save(stock);
                    successCount++;
                    log.debug("Updated price for symbol: {}", stock.getSymbol());
                } else {
                    failureCount++;
                }
            } catch (Exception e) {
                failureCount++;
                log.warn("Failed to update price for symbol: {}", 
                    stock.getSymbol());
            }
        }

        log.info("Completed live price update. Success: {}, Failures: {}", 
            successCount, failureCount);
        return successCount > 0;

    } catch (Exception e) {
        log.error("Unexpected error updating all stock prices: {}", 
            e.getMessage(), e);
        return false;
    }
}
```

---

### 4. StockService.java (INTERFACE - UPDATED)
**Location:** `backend/src/main/java/com/trd/service/StockService.java`

**New Methods Added:**
```java
Optional<StockResponse> updateStockWithLivePrice(String symbol);
boolean updateAllStocksWithLivePrices();
```

---

### 5. StockPriceScheduler.java (ALREADY EXISTS)
**Location:** `backend/src/main/java/com/trd/scheduler/StockPriceScheduler.java`

**Key Features:**
- Runs every 60 seconds with 10-second initial delay
- Updates all stocks automatically
- Tracks success/failure counts
- Logs all operations

```java
@Scheduled(fixedRate = 60000, initialDelay = 10000)
public void updateAllStockPrices() {
    try {
        log.info("Starting scheduled stock price update");
        List<Stock> stocks = stockRepository.findAll();
        
        if (stocks.isEmpty()) {
            log.info("No stocks found in database. Skipping price update.");
            return;
        }

        log.debug("Found {} stocks to update", stocks.size());
        int successCount = 0;
        int failureCount = 0;

        for (Stock stock : stocks) {
            try {
                updateStockPrice(stock);
                successCount++;
            } catch (Exception e) {
                log.warn("Failed to update price for symbol: {}", 
                    stock.getSymbol());
                failureCount++;
            }
        }

        log.info("Completed scheduled stock price update. Success: {}, Failures: {}", 
            successCount, failureCount);

    } catch (Exception e) {
        log.error("Unexpected error in scheduled stock price update: {}", 
            e.getMessage(), e);
    }
}
```

---

### 6. StockController.java (UPDATED)
**Location:** `backend/src/main/java/com/trd/controller/StockController.java`

**New Endpoints:**

```java
/**
 * Manually update a stock with live price from external API.
 * Endpoint: GET /api/stocks/update-price/{symbol}
 *
 * @param symbol the stock symbol to update
 * @return ResponseEntity containing updated stock data or 404 if not found
 */
@GetMapping("/update-price/{symbol}")
public ResponseEntity<?> updateStockPrice(@PathVariable String symbol) {
    Optional<StockResponse> updatedStock = stockService
        .updateStockWithLivePrice(symbol);
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
```

---

### 7. RestTemplateConfig.java (ALREADY EXISTS)
**Location:** `backend/src/main/java/com/trd/config/RestTemplateConfig.java`

**Provides:**
- RestTemplate bean with 5s connect timeout, 10s read timeout
- ObjectMapper bean for JSON parsing

```java
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build();
}

@Bean
public ObjectMapper objectMapper() {
    return new ObjectMapper();
}
```

---

### 8. application.properties (UPDATED)
**Location:** `backend/src/main/resources/application.properties`

**New Configuration:**
```properties
# Stock API Configuration (Alpha Vantage)
stock.api.key=demo
stock.api.base-url=https://www.alphavantage.co/query
stock.api.timeout=5000

# Logging Configuration
logging.level.root=INFO
logging.level.com.trd=DEBUG
logging.level.com.trd.scheduler=INFO
```

**To Use Real API:**
1. Sign up at https://www.alphavantage.co/
2. Get your API key
3. Update `stock.api.key=YOUR_REAL_API_KEY`

---

## Entity & Repository (UNCHANGED)

### Stock.java
**Already has all necessary fields:**
- `currentPrice` - Latest price from API
- `previousPrice` - Historical price for comparison
- `updatedAt` - Auto-updated by JPA Auditing

### StockRepository.java
**Already supports:**
- `findBySymbol(String symbol)`
- `findAll()`
- All JpaRepository standard methods

---

## Flow Diagrams

### Automatic Scheduler Flow
```
┌─────────────────────────────────────────────────────────────┐
│              Application Startup                            │
├─────────────────────────────────────────────────────────────┤
│ 1. @SpringBootApplication starts                            │
│ 2. @EnableScheduling initializes scheduler                  │
│ 3. Waits 10 seconds (initialDelay)                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ (Every 60 seconds after initial delay)
┌─────────────────────────────────────────────────────────────┐
│         StockPriceScheduler.updateAllStockPrices()          │
├─────────────────────────────────────────────────────────────┤
│ Fetch all stocks from DB                                    │
│   ↓                                                         │
│ For each stock:                                             │
│   ├─ Call ExternalStockApiService.getLiveStockPrice()      │
│   ├─ previousPrice = currentPrice                           │
│   ├─ currentPrice = newLivePrice                            │
│   └─ Save to DB                                             │
│   ↓                                                         │
│ Log success/failure counts                                  │
└─────────────────────────────────────────────────────────────┘
```

### Manual Update Flow
```
┌─────────────────────────────────────────────────────────────┐
│         GET /api/stocks/update-price/{symbol}               │
├─────────────────────────────────────────────────────────────┤
│ StockController.updateStockPrice(symbol)                    │
│   ↓                                                         │
│ StockService.updateStockWithLivePrice(symbol)               │
│   ├─ Find stock by symbol                                   │
│   ├─ Call ExternalStockApiService.getLiveStockPrice()      │
│   ├─ previousPrice = currentPrice                           │
│   ├─ currentPrice = newLivePrice                            │
│   ├─ Save to DB                                             │
│   └─ Return updated StockResponse                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Dependencies

Already included in pom.xml:
- ✅ Spring Boot 3.2.0
- ✅ Spring Web (RestTemplate)
- ✅ Spring Data JPA
- ✅ Jackson (JSON parsing)
- ✅ Lombok
- ✅ MySQL Connector

No new dependencies needed!

---

## Testing Checklist

- [ ] Application starts without errors
- [ ] Logs show scheduler initialized
- [ ] First update happens at 10 seconds
- [ ] Subsequent updates happen every 60 seconds
- [ ] API key in properties is correct
- [ ] Manual endpoint: GET /api/stocks/update-price/AAPL returns 200
- [ ] Manual endpoint: POST /api/stocks/update-all-prices returns 200
- [ ] Stock prices updated in database
- [ ] Previous prices are tracked
- [ ] Logs show success/failure information
- [ ] Existing endpoints still work unchanged

---

## Summary of Changes

| File | Change | Type |
|------|--------|------|
| TrdApplication.java | Added @EnableScheduling | UPDATE |
| StockService.java | Added 2 new methods to interface | UPDATE |
| StockServiceImpl.java | Added 2 implementation methods | UPDATE |
| StockController.java | Added 2 new endpoints | UPDATE |
| application.properties | Added Stock API config | UPDATE |
| ExternalStockApiService.java | No change needed | ✓ READY |
| StockPriceScheduler.java | No change needed | ✓ READY |
| RestTemplateConfig.java | No change needed | ✓ READY |

**Status:** ✅ All changes implemented and ready for testing

