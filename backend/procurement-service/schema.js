// schema.js
const pool  = require("./db.js");

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplier VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'Pending',
      items JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("Purchase Order table created or exists");
};

module.exports = { createTables };
