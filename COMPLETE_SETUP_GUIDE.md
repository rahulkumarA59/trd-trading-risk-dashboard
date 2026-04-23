# 🚀 Complete Setup & Deployment Guide

## ✅ Project Status

Your **Trading & Risk Dashboard (TRD)** is now fully enhanced with:

✅ Real-time stock price integration (Alpha Vantage API)
✅ Automatic scheduler (updates every 60 seconds)
✅ Professional stock market page with detailed views
✅ Beautiful stock cards with live price indicators
✅ Complete trading functionality
✅ LocalDateTime serialization fix
✅ Redis caching support
✅ Comprehensive error handling

---

## 🛠️ **Quick Setup (5 minutes)**

### **Prerequisites**
- MySQL Server running on localhost:3306
- Node.js 16+ installed
- Java 11+ installed

### **Database Setup**
```bash
# Create the TRD database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS trd;"

# Database credentials (in application.properties):
# - Username: root
# - Password: root
# - Host: localhost:3306
```

### **Step 1: Start Backend**
```bash
cd D:\TRD
.\mvnw.cmd spring-boot:run
```

**Expected Output:**
```
[main] INFO com.trd.TrdApplication - Started TrdApplication in X.XXX seconds
[main] INFO com.trd.bootstrap.StockDataInitializer - Starting stock data bootstrap...
[main] INFO com.trd.bootstrap.StockDataInitializer - Successfully initialized 12 default stocks
[pool-1-thread-1] INFO com.trd.scheduler.StockPriceScheduler - Starting scheduled stock price update
```

**Access:** `http://localhost:8083`

### **Step 2: Start Frontend**
```bash
cd D:\TRD\frontend
npm install
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

**Access:** `http://localhost:3000`

---

## 🎯 **API Endpoints**

### **Stock Management**
```
GET    /api/stocks                    # Get all stocks
GET    /api/stocks/{id}               # Get by ID
GET    /api/stocks/symbol/{symbol}    # Get by symbol (e.g., AAPL)
GET    /api/stocks/search?query=      # Search stocks
GET    /api/stocks/update-price/{symbol}    # Manual update single stock
POST   /api/stocks/update-all-prices  # Manual update all prices
```

### **Trading**
```
POST   /api/trades                    # Execute trade
GET    /api/trades                    # Get trades
GET    /api/trades/{id}               # Get trade by ID
```

### **Portfolio**
```
GET    /api/portfolio                 # Get portfolio summary
GET    /api/portfolio/holdings        # Get holdings
GET    /api/portfolio/history         # Get history
```

### **Risk Analysis**
```
GET    /api/risk/analysis             # Get risk analysis
GET    /api/risk/volatility           # Get volatility
```

### **Authentication**
```
POST   /api/auth/register             # Register user
POST   /api/auth/login                # Login user
POST   /api/auth/refresh              # Refresh token
```

---

## 🗄️ **Default Stocks Loaded**

On first startup, the system automatically initializes 12 default stocks:

| Symbol | Company | Price | Sector |
|--------|---------|-------|--------|
| AAPL | Apple Inc. | $210.15 | Technology |
| MSFT | Microsoft Corporation | $425.32 | Technology |
| GOOGL | Alphabet Inc. | $165.48 | Communication Services |
| AMZN | Amazon.com Inc. | $182.64 | Consumer Discretionary |
| NVDA | NVIDIA Corporation | $945.50 | Technology |
| TSLA | Tesla Inc. | $167.90 | Consumer Discretionary |
| META | Meta Platforms Inc. | $512.80 | Communication Services |
| JPM | JPMorgan Chase & Co. | $198.40 | Financial Services |
| V | Visa Inc. | $285.54 | Financial Services |
| JNJ | Johnson & Johnson | $159.32 | Healthcare |
| WMT | Walmart Inc. | $92.18 | Consumer Discretionary |
| PG | Procter & Gamble | $169.45 | Consumer Staples |

---

## 💰 **Real-Time Price Updates**

### **How It Works**
1. **Automatic Updates**: Every 60 seconds, the scheduler updates all stock prices
2. **Initial Delay**: First update happens 10 seconds after app starts
3. **Alpha Vantage API**: Uses free tier (limited rate: 5 calls/min, 500/day)
4. **Manual Updates**: Use "Sync" button in UI or API endpoints

### **Configure API Key**
```properties
# In backend/src/main/resources/application.properties

# Replace 'demo' with your real API key from https://www.alphavantage.co/
stock.api.key=YOUR_REAL_API_KEY

# Or set environment variable:
ALPHA_VANTAGE_API_KEY=YOUR_REAL_API_KEY
```

### **Demo Mode (Default)**
```properties
stock.api.key=demo  # Returns sample data for IBM only
```

---

## 🎨 **UI Pages**

### **1. Dashboard**
- Portfolio summary with P&amp;L
- Market snapshot (4 top stocks)
- Portfolio growth chart
- Allocation pie chart
- Recent transactions

### **2. Trading**
- Professional trading board
- Live stock quotes table
- Market statistics
- Featured stocks
- Buy/Sell execution
- Manual price refresh

### **3. Markets** (NEW)
- Comprehensive stock display
- Detailed stock cards
- Sector filtering
- Sorting options (price, change, volume)
- Top gainers/losers
- Trading functionality

### **4. Portfolio**
- Holdings summary
- Investment tracking
- Performance analysis

### **5. Risk Analysis**
- Risk metrics
- Volatility chart
- Asset allocation

### **6. Predictions**
- Price forecasting
- ML-based predictions

### **7. Transactions**
- Trade history
- Transaction details

---

## 🔧 **Configuration Reference**

### **Application Properties**
```properties
# Server
server.port=8083

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/trd?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root

# Stock API
stock.api.key=demo  # Update with real key
stock.api.base-url=https://www.alphavantage.co/query
stock.api.timeout=5000

# Scheduler
stock.scheduler.fixed-rate=60000      # Update every 60 seconds
stock.scheduler.initial-delay=10000   # Wait 10 seconds before first update
stock.bootstrap.enabled=true          # Load default stocks on startup

# Cache
spring.cache.type=simple  # or 'redis' for production
TRD_CACHE_TYPE=simple

# JWT
jwt.secret=TRDJwtSecretKeyForTradingAndRiskDashboardApplication2024SecureToken
jwt.expiration=86400000

# CORS
cors.allowed-origins=http://localhost:3000

# Logging
logging.level.com.trd=DEBUG
logging.level.com.trd.scheduler=INFO
```

---

## 🧪 **Testing the Setup**

### **Test Backend Endpoints**
```bash
# Get all stocks
curl -X GET http://localhost:8083/api/stocks

# Get AAPL stock
curl -X GET http://localhost:8083/api/stocks/symbol/AAPL

# Manually refresh all prices
curl -X POST http://localhost:8083/api/stocks/update-all-prices

# Manually refresh single stock
curl -X GET http://localhost:8083/api/stocks/update-price/AAPL
```

### **Test Frontend**
1. Navigate to `http://localhost:3000`
2. Login with test account (or register)
3. Go to Dashboard → see market snapshot
4. Go to Trading → see full stock table
5. Go to Markets → see detailed stock cards
6. Click "Sync" button → price updates from API
7. Click "Buy" → execute trade

### **Check Logs**
```bash
# Backend logs show scheduler activity:
# [pool-1-thread-1] INFO Starting scheduled stock price update
# [pool-1-thread-1] INFO Updated price for symbol: AAPL. New price: XXX

# API logs show price updates:
# GET /api/stocks/update-price/AAPL
# GET /api/stocks
```

---

## 🚀 **Deployment Checklist**

### **Before Production**
- [ ] Add real Alpha Vantage API key
- [ ] Update database credentials
- [ ] Configure JWT secret
- [ ] Set up Redis for caching
- [ ] Enable HTTPS
- [ ] Update CORS allowed origins
- [ ] Test all endpoints
- [ ] Load test the application

### **Production Configuration**
```properties
# Use environment variables for sensitive data
stock.api.key=${ALPHA_VANTAGE_API_KEY}
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
cors.allowed-origins=${ALLOWED_ORIGINS}
```

---

## 📊 **Frontend Components**

### **New Components Created**
- **StockCard.jsx**: Professional stock card with price indicators
- **Stocks.jsx**: Complete stock market page

### **Available Components**
```
src/components/
├── stocks/                    # NEW!
│   └── StockCard.jsx         # Individual stock display
├── charts/
│   ├── PortfolioGrowthChart.jsx
│   ├── AllocationPieChart.jsx
│   ├── PnLBarChart.jsx
│   ├── VolatilityChart.jsx
│   └── ...
├── ui/
│   ├── Card.jsx
│   ├── Button.jsx
│   ├── Badge.jsx
│   ├── Modal.jsx
│   ├── Input.jsx
│   └── Table.jsx
└── common/
    ├── Navbar.jsx
    ├── Sidebar.jsx
    ├── Footer.jsx
    └── ProtectedRoute.jsx
```

---

## 🏗️ **Project Structure**

```
D:\TRD/
├── backend/
│   ├── src/main/java/com/trd/
│   │   ├── TrdApplication.java (with @EnableScheduling)
│   │   ├── bootstrap/
│   │   │   └── StockDataInitializer.java (loads 12 default stocks)
│   │   ├── scheduler/
│   │   │   └── StockPriceScheduler.java (updates every 60s)
│   │   ├── service/
│   │   │   ├── StockService.java
│   │   │   ├── ExternalStockApiService.java (Alpha Vantage integration)
│   │   │   └── impl/StockServiceImpl.java
│   │   ├── controller/
│   │   │   └── StockController.java
│   │   ├── entity/
│   │   │   └── Stock.java
│   │   ├── dto/
│   │   │   └── StockResponse.java
│   │   ├── config/
│   │   │   ├── JacksonConfig.java (LocalDateTime fix)
│   │   │   └── RestTemplateConfig.java
│   │   └── repository/
│   │       └── StockRepository.java
│   └── resources/
│       └── application.properties (with stock.api.* config)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Trading.jsx
│   │   │   ├── Stocks.jsx (NEW!)
│   │   │   ├── Portfolio.jsx
│   │   │   ├── RiskAnalysis.jsx
│   │   │   ├── Prediction.jsx
│   │   │   └── Transactions.jsx
│   │   ├── components/
│   │   │   ├── stocks/
│   │   │   │   └── StockCard.jsx (NEW!)
│   │   │   ├── charts/
│   │   │   ├── ui/
│   │   │   └── common/
│   │   ├── services/
│   │   │   ├── stockService.js
│   │   │   ├── tradeService.js
│   │   │   └── ...
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx (with /stocks route)
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README files with documentation
```

---

## 🐛 **Troubleshooting**

### **Issue: Backend won't start**
```
Solution: 
1. Check MySQL is running: mysql -u root -p
2. Verify database exists: CREATE DATABASE trd;
3. Check port 8083 is available
4. Check Java version: java -version (must be 11+)
5. Look for error in logs
```

### **Issue: Stocks not showing**
```
Solution:
1. Backend must run first to bootstrap stocks
2. Check /api/stocks endpoint returns data
3. Verify MySQL database has stocks table
4. Check frontend API base URL in services/api.js
```

### **Issue: Prices not updating**
```
Solution:
1. Check scheduler logs for "Starting scheduled stock price update"
2. Verify API key in application.properties
3. Check Alpha Vantage API rate limits (5/min, 500/day)
4. Try manual sync: POST /api/stocks/update-all-prices
5. Check logs for API errors
```

### **Issue: CORS errors**
```
Solution:
1. Verify cors.allowed-origins in application.properties
2. Check frontend is on http://localhost:3000
3. Backend must be on http://localhost:8083
4. Restart both applications
```

### **Issue: LocalDateTime serialization error**
```
Solution:
✅ Already fixed! JacksonConfig.java registered JavaTimeModule
✅ All DTOs have @JsonFormat annotation
✅ Just ensure backend is rebuilt
```

---

## 📚 **Documentation Files**

All comprehensive guides are in `D:\TRD\`:
- `QUICK_START.md` - 5-minute setup
- `API_REFERENCE.md` - API documentation
- `STOCK_PRICE_INTEGRATION_GUIDE.md` - Stock integration details
- `IMPLEMENTATION_REFERENCE.md` - Code reference
- `README_DOCUMENTATION.md` - Full documentation index

---

## ✨ **Key Features Implemented**

✅ **Real-time Stock Prices**
- Alpha Vantage API integration
- Automatic updates every 60 seconds
- Manual refresh capability
- Error handling & fallback

✅ **Professional UI**
- Dashboard with market snapshot
- Trading board with live quotes
- New Markets page with detailed views
- Beautiful stock cards
- Responsive design

✅ **Data Persistence**
- PostgreSQL/MySQL database
- JPA/Hibernate ORM
- Automatic schema management
- Transaction management

✅ **Error Handling**
- Graceful API failure handling
- Comprehensive logging
- User-friendly error messages
- Toast notifications

✅ **Performance**
- Response caching
- Optional Redis support
- Efficient queries
- Optimized bundle size

✅ **Security**
- JWT authentication
- CORS protection
- Input validation
- Secure headers

---

## 🎯 **Next Steps**

1. **Start Backend:**
   ```bash
   cd D:\TRD
   .\mvnw.cmd spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd D:\TRD\frontend
   npm run dev
   ```

3. **Login:** 
   - Register new account or use existing credentials

4. **Explore:**
   - Dashboard: See market overview
   - Trading: Execute trades
   - Markets: See detailed stock information
   - Portfolio: Track investments

5. **Get Real API Key:**
   - Visit https://www.alphavantage.co/
   - Get free API key (500 calls/day limit)
   - Update `application.properties` with your key

---

## 💡 **Tips**

- Enable debug logging in `application.properties`:
  ```
  logging.level.com.trd=DEBUG
  logging.level.com.trd.scheduler=DEBUG
  ```

- Monitor scheduler activity:
  ```
  [pool-1-thread-1] INFO com.trd.scheduler.StockPriceScheduler - Starting scheduled stock price update
  ```

- Use browser DevTools to inspect API calls

- Check backend logs for API errors

---

**✅ You're Ready to Go! Start the backend and frontend and enjoy real-time stock price updates! 📈**

