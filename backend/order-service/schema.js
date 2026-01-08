const pool = require('./db');

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20),
      customer_address TEXT,
      total INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT REFERENCES orders(id) ON DELETE CASCADE,
      cake_id INT,
      name VARCHAR(255) NOT NULL,
      qty INT NOT NULL,
      price INT NOT NULL,
      subtotal INT DEFAULT 0
    );
  `);
};

module.exports = { createTables };
