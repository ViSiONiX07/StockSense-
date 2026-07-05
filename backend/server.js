const express = require('express');
const cors = require('cors');
const db = require('./db');
const { differenceInDays, subDays, format } = require('date-fns');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Auto-seed if database is empty
try {
  const itemCount = db.prepare("SELECT COUNT(*) AS count FROM items").get().count;
  if (itemCount === 0) {
    console.log("Database is empty. Auto-seeding default data...");
    require('./seed');
  }
} catch (err) {
  console.error("Failed to run database auto-seed check:", err);
}

const categoryPrices = {
  'Vegetables/Produce': 30, // average produce price/kg in INR
  'Dairy': 60,              // average dairy price/L in INR
  'Snacks': 20,             // average snack pack price in INR
  'Grains & Pulses': 80,    // grains price/kg in INR
  'Beverages': 50,          // beverages crate/unit price in INR
  'Pantry': 100             // pantry/oils price/L in INR
};

// Helper to calculate derived fields
function enrichItem(item) {
  // Get usage logs for the last 14 days
  const today = new Date();
  const fourteenDaysAgo = format(subDays(today, 14), 'yyyy-MM-dd');
  
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
  
  // Forecast days left
  let daysLeft = Infinity;
  if (avgDailyUsage > 0) {
    daysLeft = item.current_stock / avgDailyUsage;
  }

  // Calculate Status
  let status = 'In Stock';
  if (daysLeft <= 2 || item.current_stock <= item.reorder_threshold * 0.5) {
    status = 'Critical';
  } else if (item.current_stock <= item.reorder_threshold) {
    status = 'Low Supply';
  }

  // Calculate Waste Risk and Expiry Parameters
  let wasteRisk = false;
  let projectedLoss = 0;
  let remainingStockAtExpiry = 0;
  let daysToExpiry = -1;

  if (item.expiry_date) {
    daysToExpiry = differenceInDays(new Date(item.expiry_date), today);
    if (item.current_stock > 0) {
      if (avgDailyUsage > 0) {
        const projectedUsage = Math.max(0, daysToExpiry) * avgDailyUsage;
        remainingStockAtExpiry = Math.max(0, item.current_stock - projectedUsage);
        if (remainingStockAtExpiry > 0) {
          wasteRisk = true;
          const pricePerUnit = item.price > 0 ? item.price : (categoryPrices[item.category] || 30);
          projectedLoss = Math.ceil(remainingStockAtExpiry * pricePerUnit);
        }
      } else {
        // No usage: all stock is at risk of expiring
        wasteRisk = true;
        remainingStockAtExpiry = item.current_stock;
        const pricePerUnit = item.price > 0 ? item.price : (categoryPrices[item.category] || 30);
        projectedLoss = Math.ceil(item.current_stock * pricePerUnit);
      }
    }
  }

  // Suggested Order Qty
  let suggestedOrderQty = Math.max(0, (avgDailyUsage * 7) - item.current_stock);
  if (status === 'Critical' && suggestedOrderQty === 0) {
     suggestedOrderQty = avgDailyUsage * 7;
  }

  return {
    ...item,
    avgDailyUsage: parseFloat(avgDailyUsage.toFixed(2)),
    daysLeft: daysLeft === Infinity ? 'Infinite' : Math.floor(daysLeft),
    status,
    wasteRisk,
    projectedLoss,
    remainingStockAtExpiry: parseFloat(remainingStockAtExpiry.toFixed(2)),
    daysToExpiry,
    suggestedOrderQty: Math.ceil(suggestedOrderQty)
  };
}

// GET all items
app.get('/api/items', (req, res) => {
  const items = db.prepare('SELECT * FROM items').all();
  const enrichedItems = items.map(enrichItem);
  res.json(enrichedItems);
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  
  const enrichedItem = enrichItem(item);
  
  // Also return full 30 day usage for charting
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const usageHistory = db.prepare('SELECT * FROM usage_logs WHERE item_id = ? AND date >= ? ORDER BY date ASC').all(item.id, thirtyDaysAgo);
  
  res.json({ item: enrichedItem, usageHistory });
});

// POST new item
app.post('/api/items', (req, res) => {
  const { name, category, unit, current_stock, reorder_threshold, expiry_date, price } = req.body;
  const insert = db.prepare(`
    INSERT INTO items (name, category, unit, current_stock, reorder_threshold, expiry_date, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = insert.run(name, category, unit, current_stock, reorder_threshold, expiry_date, price || 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const { name, category, unit, current_stock, reorder_threshold, expiry_date, price } = req.body;
  const update = db.prepare(`
    UPDATE items SET 
      name = ?, category = ?, unit = ?, current_stock = ?, reorder_threshold = ?, expiry_date = ?, price = ?
    WHERE id = ?
  `);
  update.run(name, category, unit, current_stock, reorder_threshold, expiry_date, price || 0, req.params.id);
  res.json({ success: true });
});

// POST usage
app.post('/api/usage', (req, res) => {
  const { item_id, date, quantity_used } = req.body;
  const insert = db.prepare(`
    INSERT INTO usage_logs (item_id, date, quantity_used)
    VALUES (?, ?, ?)
  `);
  insert.run(item_id, date, quantity_used);
  
  // update stock
  db.prepare('UPDATE items SET current_stock = current_stock - ? WHERE id = ?').run(quantity_used, item_id);
  
  res.json({ success: true });
});

// POST replenish (increment stock)
app.post('/api/replenish', (req, res) => {
  const { item_id, quantity } = req.body;
  db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?').run(quantity, item_id);
  res.json({ success: true });
});

// GET all orders
app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY timestamp DESC').all();
  res.json(orders);
});

// POST new order
app.post('/api/orders', (req, res) => {
  const { item_id, item_name, quantity, unit } = req.body;
  const insert = db.prepare(`
    INSERT INTO orders (item_id, item_name, quantity, unit)
    VALUES (?, ?, ?, ?)
  `);
  const info = insert.run(item_id, item_name, quantity, unit);
  res.status(201).json({ id: info.lastInsertRowid });
});

// GET recent activity
app.get('/api/activity', (req, res) => {
  try {
    const ordersCreated = db.prepare(`
      SELECT id, item_name, quantity, unit, timestamp, 'reorder' AS type 
      FROM orders 
      ORDER BY timestamp DESC LIMIT 5
    `).all();

    const ordersReceived = db.prepare(`
      SELECT id, item_name, quantity, unit, received_at AS timestamp, 'received' AS type 
      FROM orders 
      WHERE status = 'Received' AND received_at IS NOT NULL
      ORDER BY received_at DESC LIMIT 5
    `).all();
    
    const usages = db.prepare(`
      SELECT u.id, i.name AS item_name, u.quantity_used AS quantity, i.unit, u.date || ' 12:00:00' AS timestamp, 'sale' AS type 
      FROM usage_logs u 
      JOIN items i ON u.item_id = i.id 
      ORDER BY u.id DESC LIMIT 5
    `).all();
    
    const activity = [...ordersCreated, ...ordersReceived, ...usages]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
      
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT receive order
app.put('/api/orders/:id/receive', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'Received') {
      const nowStr = new Date().toISOString();
      db.prepare("UPDATE orders SET status = 'Received', received_at = ? WHERE id = ?").run(nowStr, req.params.id);
      
      if (order.item_id) {
        db.prepare('UPDATE items SET current_stock = current_stock + ? WHERE id = ?').run(order.quantity, order.item_id);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET smart recommendation
app.get('/api/smart-recommendation', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items').all();
    const today = new Date();
    const recommendations = [];
    
    // Check 1: Trend calculation (last 7 days vs previous 7 days)
    const sevenDaysAgo = format(subDays(today, 7), 'yyyy-MM-dd');
    const fourteenDaysAgo = format(subDays(today, 14), 'yyyy-MM-dd');
    
    const trends = [];
    for (const item of items) {
      const logsLast7 = db.prepare('SELECT SUM(quantity_used) AS total FROM usage_logs WHERE item_id = ? AND date >= ?').get(item.id, sevenDaysAgo);
      const logsPrev7 = db.prepare('SELECT SUM(quantity_used) AS total FROM usage_logs WHERE item_id = ? AND date >= ? AND date < ?').get(item.id, fourteenDaysAgo, sevenDaysAgo);
      
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
    }
    
    trends.sort((a, b) => b.percentage - a.percentage);
    
    for (const t of trends) {
      recommendations.push({
        id: t.id,
        name: t.name,
        type: 'trend',
        stat: `+${t.percentage}%`,
        statLabel: `Usage increase in ${t.name}`,
        message: `Consider increasing your next reorder by ${t.suggested_extra} ${t.unit} to avoid repeat stockouts.`,
        icon: 'trending_up'
      });
    }
    
    // Check 2: Order count frequency (last 30 days)
    const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
    const ordersFreqList = db.prepare(`
      SELECT item_id, item_name, COUNT(*) AS count 
      FROM orders 
      WHERE timestamp >= ? 
      GROUP BY item_id 
      ORDER BY count DESC
    `).all(thirtyDaysAgo);
    
    for (const ord of ordersFreqList) {
      if (ord.count >= 2) {
        if (!recommendations.some(r => r.name === ord.item_name)) {
          recommendations.push({
            id: ord.item_id,
            name: ord.item_name,
            type: 'frequency',
            stat: `${ord.count}x`,
            statLabel: `Reorders of ${ord.item_name} (30d)`,
            message: `Consider raising its reorder threshold to reduce manual restocking frequency.`,
            icon: 'sync'
          });
        }
      }
    }
    
    if (recommendations.length === 0) {
      const firstItem = items[0] || { id: 1, name: 'Inventory items' };
      recommendations.push({
        id: firstItem.id,
        name: firstItem.name,
        type: 'generic',
        stat: 'Stable',
        statLabel: 'Normal levels',
        message: `Indicators for ${firstItem.name} are currently healthy. Keep monitoring the bento ledger alerts.`,
        icon: 'info'
      });
    }
    
    res.json(recommendations.slice(0, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overall usage history (last 14 days)
app.get('/api/usage-history', (req, res) => {
  try {
    const fourteenDaysAgo = format(subDays(new Date(), 14), 'yyyy-MM-dd');
    const logs = db.prepare(`
      SELECT date, SUM(quantity_used) AS total_used 
      FROM usage_logs 
      WHERE date >= ? 
      GROUP BY date 
      ORDER BY date ASC
    `).all(fourteenDaysAgo);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
