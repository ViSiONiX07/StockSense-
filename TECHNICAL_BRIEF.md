# Technical Brief: StockSense Core Inventory Logic

StockSense is an industry-agnostic inventory management system that tracks items, monitors usage history, and alerts users to stockout and expiry risks. By integrating dynamic consumption rates and manual transactions, it calculates real-time replenishment targets and projected losses to streamline logistics across retail, distribution, manufacturing, and food service sectors.

---

## 1. Forecasting Logic (Days Left & Status Prediction)

This section details how StockSense predicts when items will run out of stock and how risk levels are categorized.

### 1.1 Average Daily Usage (ADU)
Calculates the average quantity of an item consumed daily over a rolling 14-day window.

Formula:
```
Average Daily Usage = (Sum of quantity used in last 14 days) / (Number of logged usage days)
```

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
const usageLogs = db.prepare(`
  SELECT * FROM usage_logs 
  WHERE item_id = ? AND date >= ?
`).all(item.id, fourteenDaysAgo);

let totalUsage = 0;
for (const log of usageLogs) {
  totalUsage += log.quantity_used;
}

const daysWithData = Math.max(1, usageLogs.length);
const avgDailyUsage = totalUsage / daysWithData;
```

### 1.2 Days Remaining (Days Left)
Estimates the number of days of supply left before the item stock drops to zero.

Formula:
```
Days Left = Current Stock / Average Daily Usage
```
Note: If average daily usage is zero, Days Left defaults to "Infinite".

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
let daysLeft = Infinity;
if (avgDailyUsage > 0) {
  daysLeft = item.current_stock / avgDailyUsage;
}
```

### 1.3 Inventory Status Determination
Classifies the stock level of each item into Critical, Low Supply, or In Stock categories based on days left and reorder threshold boundaries.

Formula:
```
Status = "Critical" if Days Left <= 2 OR Current Stock <= (Reorder Threshold * 0.5)
Status = "Low Supply" if Current Stock <= Reorder Threshold (and not Critical)
Status = "In Stock" if otherwise
```

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
let status = 'In Stock';
if (daysLeft <= 2 || item.current_stock <= item.reorder_threshold * 0.5) {
  status = 'Critical';
} else if (item.current_stock <= item.reorder_threshold) {
  status = 'Low Supply';
}
```

---

## 2. Reorder Suggestion Logic

Determines the replenishment volume required to cover short-term operations safely.

### 2.1 Suggested Order Quantity (SOQ)
Calculates the replenishment quantity required to maintain a target coverage window of 7 days.

Formula:
```
Suggested Order Quantity = Max(0, (Average Daily Usage * 7) - Current Stock)
```
Note: If an item is in Critical status but the target calculation yields 0, the system defaults to suggesting a full 7 days of coverage (Average Daily Usage * 7).

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
let suggestedOrderQty = Math.max(0, (avgDailyUsage * 7) - item.current_stock);
if (status === 'Critical' && suggestedOrderQty === 0) {
   suggestedOrderQty = avgDailyUsage * 7;
}
```

---

## 3. Waste Risk & Expiry Calculation

Identifies perishable stock that is projected to expire before it can be consumed.

### 3.1 Days to Expiry (DTE)
Calculates the number of calendar days remaining until the item expires.

Formula:
```
Days to Expiry = Expiry Date - Today
```

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
daysToExpiry = differenceInDays(new Date(item.expiry_date), today);
```

### 3.2 Projected Usage & Remaining Stock at Expiry
Computes the stock volume remaining at expiration after accounting for average consumption.

Formula:
```
Projected Usage = Max(0, Days to Expiry) * Average Daily Usage
Remaining Stock at Expiry = Max(0, Current Stock - Projected Usage)
```

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
const projectedUsage = Math.max(0, daysToExpiry) * avgDailyUsage;
remainingStockAtExpiry = Math.max(0, item.current_stock - projectedUsage);
```

### 3.3 Projected Loss Value
Calculates the financial write-off value (in rupees) from the leftover stock at expiry, using the item unit price or category fallback rates.

Formula:
```
Projected Loss = RoundUp(Remaining Stock at Expiry * PricePerUnit)
```
Note: PricePerUnit uses the item's custom price, falling back to a pre-defined category price estimate if the item price is unset or zero.

Snippet (Source: `backend/server.js` -> `enrichItem(item)`):
```javascript
if (remainingStockAtExpiry > 0) {
  wasteRisk = true;
  const pricePerUnit = item.price > 0 ? item.price : (categoryPrices[item.category] || 30);
  projectedLoss = Math.ceil(remainingStockAtExpiry * pricePerUnit);
}
```

---

## 4. Insights Page Calculations

Analyzes historical logs and active item counts to populate charting dashboards.

### 4.1 Top Movers
Ranks items by average consumption speed, sorting descending for fastest movers and ascending (excluding zero) for slowest movers.

Formula:
```
Fastest Movers = Sort items by Average Daily Usage (Descending)
Slowest Movers = Filter items with Average Daily Usage > 0, then Sort by Average Daily Usage (Ascending)
```

Snippet (Source: `frontend/src/pages/Insights.jsx`):
```javascript
const fastestMovers = [...items]
  .filter(i => i.avgDailyUsage > 0)
  .sort((a, b) => b.avgDailyUsage - a.avgDailyUsage)
  .slice(0, 3);

const slowestMovers = [...items]
  .filter(i => i.avgDailyUsage > 0)
  .sort((a, b) => a.avgDailyUsage - b.avgDailyUsage)
  .slice(0, 3);
```

### 4.2 Total Inventory Value
Sum of the capitalization value across all tracked stock items.

Formula:
```
Total Inventory Value = Sum of (Current Stock * Price) for all items
```

Snippet (Source: `frontend/src/pages/Insights.jsx`):
```javascript
const totalValue = items.reduce((acc, curr) => acc + (curr.current_stock * (curr.price || 0)), 0);
```

---

## 5. Smart Recommendation Engine

Mines database transaction logs to suggest supply-chain optimizations in the Dashboard grid.

### 5.1 Trend Increase Recommendation
Compares the total quantity consumed in the last 7 days against the preceding 7 days to flag demand spikes.

Formula:
```
Percentage Increase = ((Last 7 Days Usage - Previous 7 Days Usage) / Previous 7 Days Usage) * 100
Suggested Extra Buffer = Last 7 Days Usage - Previous 7 Days Usage
```
Note: Triggers when usage increases by 5% or more, suggesting that reorder quantities be increased by the demand difference.

Snippet (Source: `backend/server.js` -> `GET /api/smart-recommendation`):
```javascript
const q1 = logsLast7.total || 0;
const q2 = logsPrev7.total || 0;

if (q1 > q2 && q2 > 0) {
  const pct = ((q1 - q2) / q2) * 100;
  if (pct >= 5) {
    trends.push({
      id: item.id,
      name: item.name,
      unit: item.unit,
      percentage: Math.round(pct),
      suggested_extra: Math.ceil(q1 - q2)
    });
  }
}
```

### 5.2 Frequency Fallback Recommendation
Scans reorder frequencies over the last 30 days to highlight items subject to repetitive restock processes.

Formula:
```
Trigger = Reorder Count >= 2 times within 30 days
```
Note: Suggests raising the reorder threshold to reduce transaction and management overhead.

Snippet (Source: `backend/server.js` -> `GET /api/smart-recommendation`):
```javascript
const ordersFreqList = db.prepare(`
  SELECT item_id, item_name, COUNT(*) AS count 
  FROM orders 
  WHERE timestamp >= ? 
  GROUP BY item_id 
  ORDER BY count DESC
`).all(thirtyDaysAgo);
```

---

## 6. Database Schema Summary

StockSense operates on a relational SQLite schema consisting of three core tables:

### 6.1 Tables and Schema Definitions
* **`items`**: Stores item profiles, quantities, thresholds, pricing, and expiration dates.
* **`usage_logs`**: Stores historical sales, daily transactions, and quick logs for ADU calculations.
* **`orders`**: Stores supplier reorder records and fulfillment receipts.

### 6.2 Table Relationships
* `items` maintains a one-to-many relationship with `usage_logs` (`usage_logs.item_id` references `items.id` with cascade deletion).
* `items` maintains a one-to-many relationship with `orders` (`orders.item_id` references `items.id`, set null on item deletion).

---

## 7. Tech Stack

* **Frontend:** React (v19) - Provides high-performance component mounting for responsive UI views.
* **Backend:** Node.js & Express - Implements lightweight API routing and controller logic.
* **Database:** SQLite (`better-sqlite3`) - Handles rapid disk-write querying without setting up a remote service.
* **Styling:** Tailwind CSS — Utility-first styling matching the exact design tokens (colors, spacing, typography) extracted from the Stitch design system via MCP.
* **Charts:** Recharts - Renders SVG visualizations for inventory breakdowns and waste loss projections.
* **Date Utils:** `date-fns` - Provides lightweight utilities for date parsing and rolling time range comparisons.
