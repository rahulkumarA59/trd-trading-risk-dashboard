# Stock Price Real-Time Integration Guide

## Overview
This guide documents the implementation of real-time stock price fetching using Alpha Vantage API in the Trading & Risk Dashboard (TRD) backend.

## Architecture

### Components Implemented

#### 1. **ExternalStockApiService** (`com.trd.service.ExternalStockApiService`)
- Service for fetching real-time stock prices from Alpha Vantage API
- **Key Methods:**
  - `getLiveStockPrice(String symbol)` - Fetches single stock price
  - `getLiveStockData(String symbol)` - Fetches comprehensive stock data including volume and change percent
- **Features:**
  - JSON response parsing
  - Error handling and logging
  - API rate limit detection
  - Timeout configuration

#### 2. **StockServiceImpl** (`com.trd.service.impl.StockServiceImpl`)
- Enhanced with live price update functionality
- **New Methods:**
  - `updateStockWithLivePrice(String symbol)` - Updates single stock with live price
  - `updateAllStocksWithLivePrices()` - Updates all stocks in database
- **Features:**
  - Maintains previous price history
  - Transaction management
  - Fallback to existing price on API failure

#### 3. **StockPriceScheduler** (`com.trd.scheduler.StockPriceScheduler`)
- Automatic scheduled updates of stock prices
- **Features:**
  - Runs every 60 seconds (1 minute)
  - 10-second initial delay on app startup
  - Per-stock error handling
  - Success/failure tracking

#### 4. **StockController** (`com.trd.controller.StockController`)
- REST endpoints for stock operations
- **New Endpoints:**
  - `GET /api/stocks/update-price/{symbol}` - Manual trigger to update single stock
  - `POST /api/stocks/update-all-prices` - Manual trigger to update all stocks

#### 5. **RestTemplateConfig** (`com.trd.config.RestTemplateConfig`)
- RestTemplate bean configuration with 5s connect timeout, 10s read timeout
- ObjectMapper bean for JSON parsing

#### 6. **TrdApplication**
- Added `@EnableScheduling` annotation to enable scheduled task execution

## Configuration

### Application Properties
Add the following to `application.properties`:

```properties
# Stock API Configuration (Alpha Vantage)
stock.api.key=YOUR_ALPHA_VANTAGE_API_KEY
stock.api.base-url=https://www.alphavantage.co/query
stock.api.timeout=5000

# Logging Configuration
logging.level.root=INFO
logging.level.com.trd=DEBUG
logging.level.com.trd.scheduler=INFO
```

### Getting Alpha Vantage API Key
1. Visit: https://www.alphavantage.co/
2. Sign up for a free API key
3. Free tier includes:
   - 5 API requests per minute
   - 500 API requests per day
   - Suitable for development and testing

### API Call Limits
- **Demo Key:** Very limited (for testing only)
- **Free Tier:** 5 calls/minute, 500 calls/day
- **Premium:** Unlimited requests

## API Endpoints

### Get All Stocks
```http
GET /api/stocks
```
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currentPrice": 150.25,
    "previousPrice": 149.50,
    "marketCap": 2500000000000,
    "volume": 50000000,
    "sector": "Technology",
    "description": "Apple Inc. designs...",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-22T14:45:30"
  }
]
```

### Get Stock by Symbol
```http
GET /api/stocks/symbol/AAPL
```
**Response:** `200 OK` (same as above)

### Search Stocks
```http
GET /api/stocks/search?query=apple
```
**Response:** `200 OK` (list of matching stocks)

### Update Single Stock Live Price (Manual)
```http
GET /api/stocks/update-price/AAPL
```
**Response:** `200 OK`
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "currentPrice": 150.75,
  "previousPrice": 150.25,
  ...
}
```

**Response:** `404 Not Found`
```json
{}
```

### Update All Stocks Live Prices (Manual)
```http
POST /api/stocks/update-all-prices
```
**Response:** `200 OK`
```json
{
  "message": "Stock prices updated successfully"
}
```

## How It Works

### 1. Automatic Updates (Scheduled)
```
Every 60 seconds:
1. Scheduler triggers updateAllStockPrices()
2. For each stock in database:
   a. Fetch live price from Alpha Vantage API
   b. Store current price as previous price
   c. Update current price with new live price
   d. Save to database
3. Log success/failure counts
```

### 2. Manual Updates
- **Single Stock:** Trigger via `GET /api/stocks/update-price/{symbol}`
- **All Stocks:** Trigger via `POST /api/stocks/update-all-prices`
- Both use the same underlying service methods

### 3. Error Handling
- **API Failure:** Stock keeps existing price (graceful degradation)
- **Network Timeout:** Logged as warning, stock unchanged
- **Invalid Symbol:** Logged, returns empty
- **Rate Limit:** Detected and logged, automatic retry on next cycle

## Data Flow

```
┌─────────────────────────────────────────────────┐
│          TRD Application Startup                │
├─────────────────────────────────────────────────┤
│ 1. Load application.properties                  │
│ 2. Initialize RestTemplate with timeout        │
│ 3. Initialize StockPriceScheduler               │
│ 4. Enable @Scheduled tasks                      │
└────────────┬────────────────────────────────────┘
             │
             ↓ (After 10 second initial delay)
┌─────────────────────────────────────────────────┐
│   StockPriceScheduler.updateAllStockPrices()    │
│   (Runs every 60 seconds)                       │
├─────────────────────────────────────────────────┤
│ 1. Fetch all stocks from database               │
│ 2. For each stock:                              │
│    a. Call ExternalStockApiService              │
│    b. Fetch live price from Alpha Vantage       │
│    c. Update previousPrice = currentPrice       │
│    d. Update currentPrice = livePrice           │
│    e. Save to database                          │
│ 3. Log completion statistics                    │
└─────────────────────────────────────────────────┘
```

## Database Schema

The `stocks` table already includes:
- `current_price` - Latest price from API
- `previous_price` - Price from previous update
- `updated_at` - Auto-updated by JPA auditing
- `created_at` - Auto-set on creation

## Logging Configuration

### Log Levels
- **ERROR:** API failures, unexpected exceptions
- **WARN:** Rate limits, symbol not found, API errors
- **INFO:** Scheduler start/end, update statistics
- **DEBUG:** Per-stock updates, API calls

### Example Logs
```
2024-01-22 14:45:30 INFO  Starting scheduled stock price update
2024-01-22 14:45:31 DEBUG Fetching stock price from API for symbol: AAPL
2024-01-22 14:45:32 DEBUG Successfully parsed price for symbol AAPL: 150.75
2024-01-22 14:45:32 DEBUG Updated price for symbol: AAPL. New price: 150.75, Previous price: 150.25
2024-01-22 14:45:33 INFO  Completed scheduled stock price update. Success: 5, Failures: 0
```

## Performance Considerations

### Scheduler Settings
- **Fixed Rate:** 60000 ms (1 minute)
- **Initial Delay:** 10000 ms (10 seconds)
- Configurable in `StockPriceScheduler.java`

### API Rate Limiting
- Alpha Vantage Free: 5 calls/minute
- For 5 stocks: Updates every 1 minute = 5 calls/minute ✓
- For 50 stocks: Adjust scheduler or consider upgrading API plan

### Database Operations
- Batch updates happen in transactions
- Previous price history maintained
- Updated_at field auto-managed by JPA

## Troubleshooting

### Issue: Prices not updating
**Solution:**
1. Verify `@EnableScheduling` is present in `TrdApplication`
2. Check application.properties has valid API key
3. Test API key manually: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY`
4. Check logs for errors

### Issue: API rate limit errors
**Solution:**
1. Increase scheduler interval
2. Reduce number of stocks
3. Upgrade to paid API plan

### Issue: Demo key errors
**Solution:**
1. Get real API key from https://www.alphavantage.co/
2. Update `stock.api.key` in application.properties

## Testing

### Manual Test - Get Stock
```bash
curl -X GET http://localhost:8083/api/stocks/symbol/AAPL
```

### Manual Test - Trigger Update
```bash
curl -X GET http://localhost:8083/api/stocks/update-price/AAPL
```

### Manual Test - Update All
```bash
curl -X POST http://localhost:8083/api/stocks/update-all-prices
```

### Monitor Logs
```bash
tail -f logs/app.log | grep StockPrice
```

## Future Enhancements

1. **Multiple API Providers:** Switch between Alpha Vantage, Yahoo Finance, IEX
2. **Price History:** Track historical prices
3. **Alerts:** Notify on significant price changes
4. **WebSocket Updates:** Real-time price updates to frontend
5. **Batch API Calls:** Reduce API calls using batch endpoints
6. **Caching:** Cache prices for configurable duration
7. **Async Updates:** Non-blocking price updates

## Summary

The implementation provides:
✅ Real-time stock price fetching from Alpha Vantage
✅ Automatic scheduled updates every 60 seconds
✅ Manual trigger endpoints for on-demand updates
✅ Robust error handling and logging
✅ Previous price tracking for change indicators
✅ Graceful degradation on API failures
✅ Existing endpoints remain unchanged
✅ Production-ready code with proper transactions

All original endpoints continue to work unchanged while new functionality takes care of keeping prices current.

