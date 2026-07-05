const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'stocksense.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL NOT NULL,
      reorder_threshold REAL NOT NULL,
      expiry_date TEXT,
      price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      quantity_used REAL NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      status TEXT DEFAULT 'Transmitted',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      received_at DATETIME,
      FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE SET NULL
    );
  `);

  try {
    db.exec("ALTER TABLE orders ADD COLUMN received_at DATETIME");
  } catch (err) {
    // Column already exists
  }
}

initDb();

module.exports = db;
