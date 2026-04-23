# Quick Start Guide - Stock Price Real-Time Integration

## 📋 What Was Implemented

Your TRD backend now has:
- ✅ Real-time stock price fetching from Alpha Vantage API
- ✅ Automatic price updates every 60 seconds
- ✅ Manual trigger endpoints for on-demand updates
- ✅ Previous price tracking
- ✅ Error handling and logging
- ✅ Zero breaking changes to existing endpoints

---

## 🚀 Getting Started (3 Steps)

### Step 1: Get API Key (FREE)
1. Visit: https://www.alphavantage.co/
2. Click "Get Free API Key"
3. Sign up with your email
4. Copy the API key

### Step 2: Update Configuration
Open `backend/src/main/resources/application.properties` and update:

```properties
# Replace 'demo' with your actual API key
stock.api.key=YOUR_API_KEY_HERE
```

**Demo key available for testing but has very limited calls**

### Step 3: Start the Application
```bash
mvn clean install
mvn spring-boot:run
```

Wait for logs showing:
```
StockPriceScheduler : Starting scheduled stock price update
```

---

## 📡 Test the Integration

### Test 1: Get All Stocks
```bash
curl -X GET http://localhost:8083/api/stocks
```

### Test 2: Update Single Stock (Manual)
```bash
curl -X GET http://localhost:8083/api/stocks/update-price/AAPL
```

Response should show updated prices:
```json
{
  "symbol": "AAPL",
  "currentPrice": 150.75,
  "previousPrice": 150.25,
  "updatedAt": "2024-01-22T14:45:33"
}
```

### Test 3: Update All Stocks (Manual)
```bash
curl -X POST http://localhost:8083/api/stocks/update-all-prices
```

### Test 4: Check Logs
Look for logs like:
```
INFO - Starting scheduled stock price update
INFO - Completed scheduled stock price update. Success: 5, Failures: 0
```

---

## 🔑 New API Endpoints

### Manual Price Updates

#### Update Single Stock
```http
GET /api/stocks/update-price/{symbol}
```
**Example:** `GET /api/stocks/update-price/AAPL`

**Status Codes:**
- `200 OK` - Stock updated successfully
- `404 Not Found` - Stock symbol doesn't exist

---

#### Update All Stocks
```http
POST /api/stocks/update-all-prices
```

**Status Codes:**
- `200 OK` - Batch update completed
- Response includes success message

---

## ⏰ Automatic Updates

Updates happen automatically:
- **First update:** 10 seconds after app starts
- **Subsequent updates:** Every 60 seconds

All existing endpoints continue to work unchanged.

---

## 🛠️ Configuration Reference

| Property | Default | Description |
|----------|---------|-------------|
| `stock.api.key` | demo | Your Alpha Vantage API key |
| `stock.api.base-url` | https://www.alphavantage.co/query | API endpoint |
| `stock.api.timeout` | 5000 | API timeout in milliseconds |

**Scheduler Settings** (in `StockPriceScheduler.java`):
- Update interval: 60000 ms (1 minute)
- Initial delay: 10000 ms (10 seconds)

To change update frequency, modify in `StockPriceScheduler.java`:
```java
@Scheduled(fixedRate = 60000, initialDelay = 10000)
// Change 60000 to desired interval in milliseconds
```

---

## 📊 Database

No new tables needed! The `stocks` table already has:
- `current_price` - Latest live price
- `previous_price` - Previous price
- `updated_at` - Last update timestamp

---

## 🔍 Monitoring & Logs

### Key Log Messages

**Success:**
```
INFO - Starting scheduled stock price update
DEBUG - Updated price for symbol: AAPL. New price: 150.75
INFO - Completed scheduled stock price update. Success: 5, Failures: 0
```

**API Issues:**
```
WARN - API Rate limit or quota issue for symbol AAPL
WARN - No live price available for symbol: AAPL
ERROR - Error fetching live stock price for symbol: AAPL
```

### Enable Debug Logging
Update `application.properties`:
```properties
logging.level.com.trd=DEBUG
logging.level.com.trd.scheduler=DEBUG
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Starting scheduled stock price update" never appears
**Solution:** Verify `TrdApplication.java` has `@EnableScheduling` annotation

### Issue: Prices not updating
**Solution:**
1. Check API key is correct: `stock.api.key=YOUR_KEY`
2. Test API key manually: https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY
3. Check logs for rate limit messages

### Issue: "API Rate limit" errors
**Possible causes:**
- Using demo key (very limited)
- Too many stocks for free tier (5 calls/minute)
- Making manual requests too frequently

**Solution:** 
- Get real API key
- Upgrade to paid plan
- Reduce update frequency

### Issue: Database errors
**Solution:**
1. Verify MySQL is running
2. Verify `stocks` table exists
3. Check logs for detailed error messages

---

## 🧪 Testing Workflow

```
1. Start application
   ↓
2. Wait 10 seconds (initial delay)
   ↓
3. Check logs for first update
   ↓
4. GET /api/stocks to see updated prices
   ↓
5. Test manual update: GET /api/stocks/update-price/AAPL
   ↓
6. Wait 60 seconds and check logs for next automatic update
   ↓
✅ Integration working!
```

---

## 📚 Files Modified

| File | Type | Changes |
|------|------|---------|
| `TrdApplication.java` | Main App | Added @EnableScheduling |
| `StockService.java` | Interface | Added 2 new methods |
| `StockServiceImpl.java` | Implementation | Added 2 new methods |
| `StockController.java` | REST API | Added 2 new endpoints |
| `application.properties` | Config | Added API configuration |

All other files already had the required code.

---

## ✨ Key Features

- **Real-time Data:** Fetches live prices from Alpha Vantage
- **Automatic Updates:** Every 60 seconds without manual intervention
- **Manual Triggers:** On-demand price updates via REST API
- **Price History:** Tracks previous price for change indicators
- **Error Resilience:** Gracefully handles API failures
- **Logging:** Comprehensive logging for monitoring
- **Transaction Safe:** Uses Spring's transaction management
- **No Breaking Changes:** All existing endpoints work unchanged

---

## 🎯 Next Steps

1. ✅ Get API Key from Alpha Vantage
2. ✅ Update `application.properties`
3. ✅ Start the application
4. ✅ Test the endpoints
5. ✅ Monitor logs
6. ✅ Deploy to production

---

## 📞 Support References

- **Alpha Vantage Docs:** https://www.alphavantage.co/documentation/
- **Spring Scheduling:** https://spring.io/guides/gs/scheduling-tasks/
- **API Key Management:** https://www.alphavantage.co/api/

---

## 📄 Additional Documentation

For detailed information, see:
- `STOCK_PRICE_INTEGRATION_GUIDE.md` - Complete architecture guide
- `IMPLEMENTATION_REFERENCE.md` - Full code reference

---

**Status:** ✅ Ready for testing and deployment!

