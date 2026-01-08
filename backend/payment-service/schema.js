const pool = require('./db');

const createTables = async () => {
  try {
    // Tabel payments untuk menyimpan tagihan dari Supplier (Toko Bahan Kue)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE,
        supplier_name VARCHAR(255),
        items JSONB,
        amount NUMERIC NOT NULL,
        status VARCHAR(30) DEFAULT 'UNPAID',
        due_date DATE,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Payment tables ready');
  } catch (err) {
    console.error('❌ Failed to create payment tables:', err);
    throw err;
  }
};

module.exports = { createTables };
