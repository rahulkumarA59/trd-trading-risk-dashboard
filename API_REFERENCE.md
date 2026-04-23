# API Reference - Stock Price Integration

## Base URL
```
http://localhost:8083/api/stocks
```

---

## Endpoints

### 1️⃣ Get All Stocks
Retrieve all stocks with their current prices

**Endpoint:**
```http
GET /api/stocks
```

**Description:**
Fetches all stocks from the database, including their current and previous prices.

**Parameters:** None

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Response Body:**
```json
[
  {
    "id": 1,
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currentPrice": 150.75,
    "previousPrice": 150.25,
    "marketCap": 2500000000000,
    "volume": 50000000,
    "sector": "Technology",
    "description": "Apple Inc. is an American technology company...",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-22T14:45:33"
  },
  {
    "id": 2,
    "symbol": "MSFT",
    "name": "Microsoft Corporation",
    "currentPrice": 380.50,
    "previousPrice": 379.75,
    ...
  }
]
```

**Example Request:**
```bash
curl -X GET http://localhost:8083/api/stocks
```

---

### 2️⃣ Get Stock by ID
Retrieve a specific stock by its ID

**Endpoint:**
```http
GET /api/stocks/{id}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | Integer | Yes | Stock ID |

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Response Body:**
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "currentPrice": 150.75,
  "previousPrice": 150.25,
  "marketCap": 2500000000000,
  "volume": 50000000,
  "sector": "Technology",
  "description": "Apple Inc.",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-22T14:45:33"
}
```

**Error Response:**
```http
HTTP/1.1 404 Not Found
```

**Example Request:**
```bash
curl -X GET http://localhost:8083/api/stocks/1
```

---

### 3️⃣ Get Stock by Symbol
Retrieve a specific stock by its ticker symbol

**Endpoint:**
```http
GET /api/stocks/symbol/{symbol}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | String | Yes | Stock ticker symbol (e.g., AAPL, MSFT) |

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Response Body:**
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "currentPrice": 150.75,
  "previousPrice": 150.25,
  "marketCap": 2500000000000,
  "volume": 50000000,
  "sector": "Technology",
  "description": "Apple Inc.",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-22T14:45:33"
}
```

**Error Response:**
```http
HTTP/1.1 404 Not Found
```

**Example Request:**
```bash
curl -X GET http://localhost:8083/api/stocks/symbol/AAPL
```

---

### 4️⃣ Search Stocks
Search stocks by name or symbol

**Endpoint:**
```http
GET /api/stocks/search
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | String | Yes | Search query (searches name and symbol) |

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Response Body:**
```json
[
  {
    "id": 1,
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currentPrice": 150.75,
    "previousPrice": 150.25,
    ...
  }
]
```

**Example Request:**
```bash
curl -X GET "http://localhost:8083/api/stocks/search?query=apple"
```

---

### 5️⃣ Update Single Stock Price (NEW) ⭐
Manually trigger price update for a single stock

**Endpoint:**
```http
GET /api/stocks/update-price/{symbol}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | String | Yes | Stock ticker symbol (e.g., AAPL) |

**Description:**
Fetches the live price from Alpha Vantage API for the specified stock symbol and updates the database with:
- New current price
- Previous price (previous current becomes previous)
- Updated timestamp

**Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Response Body:**
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "currentPrice": 150.85,
  "previousPrice": 150.75,
  "marketCap": 2500000000000,
  "volume": 50000000,
  "sector": "Technology",
  "description": "Apple Inc.",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-22T14:46:33"
}
```

**Response (Symbol Not Found):**
```http
HTTP/1.1 404 Not Found
```

**Response (API Failure - Graceful):**
```http
HTTP/1.1 404 Not Found
```

**Example Request:**
```bash
curl -X GET http://localhost:8083/api/stocks/update-price/AAPL
```

**Use Cases:**
- Manually refresh prices on demand
- Test API integration
- Update single stock without waiting for scheduler
- Force immediate price update for critical monitoring

---

### 6️⃣ Update All Stocks Prices (NEW) ⭐
Manually trigger price update for all stocks

**Endpoint:**
```http
POST /api/stocks/update-all-prices
```

**Description:**
Fetches live prices from Alpha Vantage API for all stocks in the database and updates them with:
- New current prices
- Previous prices
- Updated timestamps

**Request Body:** None required

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
```

**Response Body (Success):**
```json
{
  "message": "Stock prices updated successfully"
}
```

**Response Body (Partial/No Success):**
```json
{
  "message": "No stocks were successfully updated"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8083/api/stocks/update-all-prices
```

**Example with cURL:**
```bash
curl -X POST \
  http://localhost:8083/api/stocks/update-all-prices \
  -H 'Content-Type: application/json'
```

**Use Cases:**
- Force immediate refresh of all stock prices
- Synchronize database with latest market data
- Troubleshooting and testing
- Manual trigger outside of scheduled interval

---

## Response Models

### Stock Object
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "currentPrice": 150.75,
  "previousPrice": 150.25,
  "marketCap": 2500000000000,
  "volume": 50000000,
  "sector": "Technology",
  "description": "Apple Inc. is an American technology company...",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-22T14:45:33"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Unique stock identifier (auto-generated) |
| symbol | String | Stock ticker symbol (e.g., AAPL, MSFT) |
| name | String | Company name |
| currentPrice | BigDecimal | Current stock price (from latest API fetch) |
| previousPrice | BigDecimal | Previous stock price (from last update) |
| marketCap | Long | Market capitalization in dollars |
| volume | Long | Trading volume |
| sector | String | Industry sector (Technology, Finance, etc.) |
| description | String | Company description |
| createdAt | LocalDateTime | When stock was added to database |
| updatedAt | LocalDateTime | When stock was last updated |

---

## Error Responses

### 404 Not Found
Returned when a resource doesn't exist

```http
HTTP/1.1 404 Not Found
Content-Type: application/json
```

**Possible Causes:**
- Stock ID doesn't exist
- Stock symbol doesn't exist
- Price update failed to fetch live price

---

### Error Message Format
```json
{
  "timestamp": "2024-01-22T14:45:33.123456",
  "status": 404,
  "error": "Not Found",
  "message": "Stock not found with symbol: XYZ",
  "path": "/api/stocks/symbol/XYZ"
}
```

---

## Request Examples

### cURL Examples

#### Get all stocks
```bash
curl -X GET http://localhost:8083/api/stocks
```

#### Get stock by symbol
```bash
curl -X GET http://localhost:8083/api/stocks/symbol/AAPL
```

#### Search stocks
```bash
curl -X GET "http://localhost:8083/api/stocks/search?query=apple"
```

#### Update single stock price
```bash
curl -X GET http://localhost:8083/api/stocks/update-price/AAPL \
  -H "Accept: application/json"
```

#### Update all stock prices
```bash
curl -X POST http://localhost:8083/api/stocks/update-all-prices \
  -H "Content-Type: application/json"
```

### JavaScript (Fetch) Examples

#### Get all stocks
```javascript
fetch('http://localhost:8083/api/stocks')
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Update single stock
```javascript
fetch('http://localhost:8083/api/stocks/update-price/AAPL')
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Update all stocks
```javascript
fetch('http://localhost:8083/api/stocks/update-all-prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## Automatic Updates

In addition to these endpoints, prices are updated automatically:

- **Frequency:** Every 60 seconds
- **First Update:** 10 seconds after application starts
- **No Action Required:** Happens in background automatically
- **Logs:** Check application logs for "StockPriceScheduler" messages

---

## Rate Limiting

Alpha Vantage API limits:
- **Free Tier:** 5 API calls per minute, 500 per day
- **Paid Plans:** Unlimited calls

**Guidelines:**
- With 5 stocks: 1 call/stock × 60s interval = 5 calls/min ✓ Within limit
- With 10 stocks: 1 call/stock × 60s interval = 10 calls/min ✗ Exceeds limit
- Solution: Increase interval to 120s or upgrade API plan

---

## Common Use Cases

### Use Case 1: Display All Stocks with Latest Prices
```bash
GET /api/stocks
```
Returns all stocks with current and previous prices for display

### Use Case 2: Refresh Specific Stock
```bash
GET /api/stocks/update-price/AAPL
```
Forces immediate price refresh for monitoring specific stock

### Use Case 3: Check Price Change
```bash
GET /api/stocks/symbol/AAPL
```
Compare `currentPrice` with `previousPrice` to calculate change

### Use Case 4: Batch Refresh
```bash
POST /api/stocks/update-all-prices
```
Forces immediate refresh of all stocks for real-time dashboard

### Use Case 5: Search and Update
```bash
GET /api/stocks/search?query=tech
GET /api/stocks/update-price/AAPL
```
Search for stocks, then update specific ones

---

## Status Codes Summary

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 404 | Not Found | Stock or resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## Headers

### Request Headers
```
Accept: application/json
Content-Type: application/json (for POST requests)
```

### Response Headers
```
Content-Type: application/json
```

---

## Performance Notes

- List retrieval (`GET /api/stocks`) is read-only and cached by JPA
- Price updates retrieve data from external API (may take 1-2 seconds)
- Database operations are transactional for data consistency
- Automatic updates run asynchronously (don't block API requests)

---

## Support & Troubleshooting

### Endpoint Returns 404
- Verify stock exists in database
- Check symbol is spelled correctly
- Use search endpoint to find symbols

### Update Returns 404
- Stock symbol may not exist
- API key might be invalid
- Try manual API call: https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY

### Prices Stuck
- Check application logs
- Try manual update endpoint
- Verify API quota hasn't been exceeded

---

**Documentation Last Updated:** January 22, 2024
**Version:** 1.0
**Status:** ✅ Production Ready

