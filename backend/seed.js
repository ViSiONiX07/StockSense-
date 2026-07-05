const db = require('./db');
const { subDays, format, addDays } = require('date-fns');

function seed() {
  console.log('Seeding database...');
  
  // Clear existing
  db.prepare('DELETE FROM usage_logs').run();
  db.prepare('DELETE FROM items').run();
  db.prepare('DELETE FROM orders').run();
  
  // Reset autoincrement sequences
  try {
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'items'").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'usage_logs'").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'orders'").run();
  } catch (err) {
    // sqlite_sequence might not exist if no tables have auto-incremented yet
  }

  const insertItem = db.prepare(`
    INSERT INTO items (name, category, unit, current_stock, reorder_threshold, expiry_date, price) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUsage = db.prepare(`
    INSERT INTO usage_logs (item_id, date, quantity_used) 
    VALUES (?, ?, ?)
  `);

  const today = new Date();

  // Categories: Produce, Snacks, Grains & Pulses, Dairy, Beverages, Pantry
  const itemsData = [
    { name: 'Tomatoes', category: 'Vegetables/Produce', unit: 'kg', current_stock: 5, reorder_threshold: 15, expiry_date: format(addDays(today, 7), 'yyyy-MM-dd'), price: 30, daily_usage_avg: 4 }, // Critical
    { name: 'Onions', category: 'Vegetables/Produce', unit: 'kg', current_stock: 40, reorder_threshold: 20, expiry_date: format(addDays(today, 30), 'yyyy-MM-dd'), price: 25, daily_usage_avg: 1.5 },
    { name: 'Lays Chips', category: 'Snacks', unit: 'packs', current_stock: 50, reorder_threshold: 20, expiry_date: format(addDays(today, 90), 'yyyy-MM-dd'), price: 20, daily_usage_avg: 3 },
    { name: 'Biscuits', category: 'Snacks', unit: 'packs', current_stock: 60, reorder_threshold: 25, expiry_date: format(addDays(today, 120), 'yyyy-MM-dd'), price: 15, daily_usage_avg: 2.5 },
    { name: 'Basmati Rice', category: 'Grains & Pulses', unit: 'kg', current_stock: 100, reorder_threshold: 30, expiry_date: format(addDays(today, 180), 'yyyy-MM-dd'), price: 90, daily_usage_avg: 2 },
    { name: 'Toor Dal', category: 'Grains & Pulses', unit: 'kg', current_stock: 45, reorder_threshold: 15, expiry_date: format(addDays(today, 180), 'yyyy-MM-dd'), price: 85, daily_usage_avg: 1.5 },
    { name: 'Milk', category: 'Dairy', unit: 'liters', current_stock: 30, reorder_threshold: 10, expiry_date: format(addDays(today, 3), 'yyyy-MM-dd'), price: 60, daily_usage_avg: 1 }, // Waste risk
    { name: 'Paneer', category: 'Dairy', unit: 'kg', current_stock: 10, reorder_threshold: 5, expiry_date: format(addDays(today, 5), 'yyyy-MM-dd'), price: 320, daily_usage_avg: 1 },
    { name: 'Sunflower Oil', category: 'Pantry', unit: 'liters', current_stock: 25, reorder_threshold: 10, expiry_date: format(addDays(today, 300), 'yyyy-MM-dd'), price: 120, daily_usage_avg: 0.5 },
    { name: 'Soft Drink Crates', category: 'Beverages', unit: 'crates', current_stock: 15, reorder_threshold: 10, expiry_date: format(addDays(today, 150), 'yyyy-MM-dd'), price: 400, daily_usage_avg: 1 },
  ];

  for (const item of itemsData) {
    const info = insertItem.run(item.name, item.category, item.unit, item.current_stock, item.reorder_threshold, item.expiry_date, item.price);
    const itemId = info.lastInsertRowid;

    // Generate 30 days of usage history
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      // add a little randomness to the daily usage
      const variance = (Math.random() - 0.5) * (item.daily_usage_avg * 0.4); 
      let used = item.daily_usage_avg + variance;
      if (used < 0) used = 0;
      insertUsage.run(itemId, date, parseFloat(used.toFixed(2)));
    }
  }

  console.log('Database seeded successfully.');
}

seed();
