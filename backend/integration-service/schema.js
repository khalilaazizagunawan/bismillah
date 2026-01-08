const pool = require('./db');

const createTables = async () => {
  // Tabel untuk menyimpan order yang dibuat ke supplier (Toko Bahan Kue)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_orders (
      id SERIAL PRIMARY KEY,
      items JSONB NOT NULL,
      total_amount NUMERIC DEFAULT 0,
      status VARCHAR(50) DEFAULT 'PENDING',
      supplier_invoice VARCHAR(100),
      supplier_response JSONB,
      notes TEXT,
      paid_at TIMESTAMP,
      received_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Tabel untuk menyimpan invoice yang diterima dari supplier
  await pool.query(`
    CREATE TABLE IF NOT EXISTS received_invoices (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(100) UNIQUE NOT NULL,
      supplier_order_id INT,
      amount NUMERIC NOT NULL,
      status VARCHAR(50) DEFAULT 'UNPAID',
      due_date DATE,
      items JSONB,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Tabel untuk log integrasi
  await pool.query(`
    CREATE TABLE IF NOT EXISTS integration_logs (
      id SERIAL PRIMARY KEY,
      direction VARCHAR(20) NOT NULL,
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      request_body JSONB,
      response_body JSONB,
      status_code INT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Integration tables created');
};

module.exports = { createTables };
