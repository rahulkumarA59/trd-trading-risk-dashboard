# 🧪 **Testing & Verification Checklist**

## **Pre-Launch Verification**

### **✅ Backend Setup**
- [ ] MySQL database created and running
- [ ] Database credentials match `application.properties`
- [ ] Backend built successfully: `.\mvnw.cmd clean install -q`
- [ ] No compilation errors
- [ ] Port 8083 is available

### **✅ Frontend Setup**
- [ ] Node.js installed: `node -v`
- [ ] npm installed: `npm -v`
- [ ] Dependencies installed: `npm install` in frontend folder
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors
- [ ] Port 3000 is available

---

## **🚀 Launch Steps**

### **Terminal 1: Start Backend**
```powershell
cd D:\TRD
.\mvnw.cmd spring-boot:run
```

**Wait for:**
```
[main] INFO com.trd.TrdApplication - Started TrdApplication in X.XXX seconds
[main] INFO com.trd.bootstrap.StockDataInitializer - Successfully initialized 12 default stocks
[pool-1-thread-1] INFO com.trd.scheduler.StockPriceScheduler - Starting scheduled stock price update
```

### **Terminal 2: Start Frontend**
```powershell
cd D:\TRD\frontend
npm run dev
```

**Wait for:**
```
  VITE v4.x.x  ready in XXX ms
  ➜  Local:   http://localhost:3000/
```

---

## **🔍 Functional Tests**

### **Test 1: Backend API Response**
```bash
# In browser or Postman
GET http://localhost:8083/api/stocks
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "currentPrice": 210.15,
    "previousPrice": 207.80,
    "sector": "Technology",
    "marketCap": 3100000000000,
    "volume": 52345000,
    "updatedAt": "2026-04-24 XX:XX:XX"
  },
  ...
]
```

### **Test 2: Frontend Loads Successfully**
1. Open `http://localhost:3000`
2. Should redirect to login if not authenticated
3. Register or login with existing account
4. Dashboard loads without errors

### **Test 3: Dashboard Market Snapshot**
1. Go to Dashboard
2. Scroll to "Market Snapshot" section
3. Should show 4 stock cards with:
   - Stock symbol and name
   - Current price in USD
   - Percentage change (with color indicator)
   - Updated timestamp
   - Trending indicator

**Expected display:**
```
┌─────────────────────────────────────┐
│ AAPL                      +0.78%    │
│ Apple Inc.                          │
│ $210.15                             │
│ Momentum positive                   │
│ Updated 2:30 PM                     │
└─────────────────────────────────────┘
```

### **Test 4: Trading Page**
1. Go to Trading page
2. Top section should show:
   - Live Market Board badge
   - "Auto sync every 60s" indicator
   - 4 featured stocks cards
   - Market Pulse stats (gainers/losers/sectors)
3. Bottom section should show:
   - Searchable stock table
   - All 12+ stocks with data
   - Buy/Sell buttons for each stock

### **Test 5: Markets Page (NEW)**
1. Go to Markets page
2. Should show:
   - Stats cards (Total Stocks, Gainers, Losers, Sectors)
   - Top Gainer and Top Loser cards
   - Search/filter controls
   - Stock grid with 2 columns (responsive)
   - Stock cards with professional styling

**Stock card should show:**
- Symbol and company name
- Current price in large font
- Previous price with trend color
- Sector badge
- Last update time
- Sync, Buy, Sell buttons

### **Test 6: Manual Price Refresh**
1. Click "Sync" button on any stock in Markets page
2. Loading spinner should appear
3. Price should update (if API has data)
4. Toast notification: "Stock symbol synced"
5. Verify `updatedAt` timestamp changed

### **Test 7: Execute a Trade**
1. Click "Buy" on any stock
2. Trade modal opens showing:
   - Stock symbol and price
   - Buy/Sell toggler
   - Quantity input
   - Estimated total calculation
3. Enter quantity: 10
4. Click "Buy Now"
5. Toast: "BUY order for 10 shares of [SYMBOL] executed"
6. Modal closes
7. Portfolio/holdings should reflect new position

### **Test 8: Automatic Price Updates**
1. Note current stock price on Markets page
2. Wait 60+ seconds
3. Prices should auto-update (if API available)
4. Check backend logs for price update messages
5. Frontend should reflect changes

---

## **📊 API Integration Tests**

### **Test Manual Stock Update**
```bash
# Single stock
curl -X GET http://localhost:8083/api/stocks/update-price/AAPL

# All stocks
curl -X POST http://localhost:8083/api/stocks/update-all-prices
```

**Expected**: Success response with updated prices

### **Test Stock Search**
```bash
curl -X GET "http://localhost:8083/api/stocks/search?query=Apple"
```

**Expected**: Returns matching stocks (AAPL - Apple Inc.)

### **Test Symbol Query**
```bash
curl -X GET http://localhost:8083/api/stocks/symbol/MSFT
```

**Expected**: Returns MSFT stock data

---

## **🎨 UI/UX Tests**

### **Responsive Design**
- [ ] Desktop (1920px): All elements display correctly
- [ ] Tablet (768px): Layout adapts
- [ ] Mobile (375px): Stack vertically, scrollable
- [ ] No horizontal scroll on any viewport
- [ ] Text readable on all sizes

### **Color Scheme**
- [ ] ✅ Green colors for positive changes/gains
- [ ] ❌ Red colors for negative changes/losses  
- [ ] 🔵 Blue/cyan for neutral/info elements
- [ ] ⚪ Dark theme applied consistently

### **Interactions**
- [ ] Buttons have hover effects
- [ ] Loading states show spinner
- [ ] Modals are closable
- [ ] Dropdowns work smoothly
- [ ] Filters apply immediately
- [ ] Toasts appear for actions

---

## **🔒 Security Tests**

### **Authentication**
- [ ] Cannot access protected routes without login
- [ ] Login redirects to dashboard
- [ ] Logout clears session
- [ ] JWT token stored in localStorage
- [ ] Token refreshes correctly

### **Data Privacy**
- [ ] Sensitive data not logged
- [ ] API key not exposed in frontend
- [ ] Database passwords not in code
- [ ] CORS properly configured

---

## **⚡ Performance Tests**

### **Load Times**
- [ ] Dashboard loads in < 2 seconds
- [ ] Trading page loads in < 2 seconds
- [ ] Markets page loads in < 2 seconds
- [ ] Stock cards render smoothly
- [ ] No UI jank or freezing

### **API Response Times**
- [ ] GET /api/stocks: < 500ms
- [ ] GET /api/stocks/{symbol}: < 300ms
- [ ] POST /api/stocks/update-all-prices: < 1s
- [ ] Search query: < 800ms

### **Memory Usage**
- [ ] Frontend bundle < 500KB (gzipped)
- [ ] No memory leaks in long sessions
- [ ] Smooth page transitions

---

## **🐛 Error Handling Tests**

### **Backend Unavailable**
1. Stop backend
2. Try to load stocks
3. Should show error message
4. Frontend should still load without crashing

### **Invalid Stock Symbol**
```bash
curl -X GET http://localhost:8083/api/stocks/symbol/INVALID
```
**Expected**: 404 error with message

### **Invalid Quantity in Trade**
1. Open trade modal
2. Enter 0 or negative quantity
3. Click Buy/Sell
4. Should show validation error
5. Trade should not execute

### **Network Timeout**
1. Slow down network (use DevTools)
2. Try to load stocks
3. Should timeout gracefully
4. Error message should appear
5. No infinite loading

---

## **📋 Verification Checklist**

### **Daily Verification**
When first running the system:

```
BACKEND CHECKLIST:
├─ [✓] MySQL running and connected
├─ [✓] Bootstrap initialized 12 stocks
├─ [✓] Scheduler running (logs show "Starting scheduled update")
├─ [✓] API endpoints responding
├─ [✓] Stock prices updating
├─ [✓] No error logs in console
└─ [✓] Database has data in 'stocks' table

FRONTEND CHECKLIST:
├─ [✓] Page loads without errors
├─ [✓] All pages accessible (if logged in)
├─ [✓] Dashboard shows stocks
├─ [✓] Trading board works
├─ [✓] Markets page shows cards
├─ [✓] Trade execution works
├─ [✓] Styling looks professional
└─ [✓] No console errors (F12 DevTools)

USER FLOW CHECKLIST:
├─ [✓] Register/Login works
├─ [✓] Can view stocks
├─ [✓] Can sync prices
├─ [✓] Can execute trades
├─ [✓] Portfolio updates
├─ [✓] Price updates automatic
└─ [✓] All notifications appear
```

---

## **🎯 Success Criteria**

✅ **Backend**
- Starts successfully
- Loads 12 default stocks on first run
- Updates prices every 60 seconds automatically
- API endpoints return JSON with correct structure
- Logger shows activity with timestamps

✅ **Frontend**
- Loads without errors
- All pages render correctly
- Stock data displays properly formatted
- Interactive elements respond smoothly
- Trades execute successfully
- Prices update in real-time

✅ **Integration**
- Frontend communicates with backend
- Data synchronized across pages
- Prices reflect backend values
- Portfolio updates immediately after trade
- No API errors in console

✅ **Professional Look**
- Clean, modern UI design
- Consistent color scheme (dark mode)
- Responsive on all devices
- Smooth animations
- Professional typography
- Proper spacing and alignment

---

## **📞 Troubleshooting Guide**

If tests fail, check:

| Issue | Solution |
|-------|----------|
| Backend won't start | Check MySQL, port 8083, Java version |
| Stocks not showing | Run bootstrap, check /api/stocks endpoint |
| Prices not updating | Check scheduler logs, verify API key |
| Frontend errors | Check console (F12), verify API base URL |
| Trade fails | Check backend logs, verify symbol exists |
| CORS errors | Verify cors.allowed-origins in properties |
| Slow performance | Check network, database indexes, API rate limits |

---

## **✅ All Tests Passed?**

Great! Your system is ready for:
1. ✅ Local development
2. ✅ Testing with real data
3. ✅ Demo to stakeholders
4. ✅ Deployment preparation

**Next:** Deploy to production with real API key and database!

