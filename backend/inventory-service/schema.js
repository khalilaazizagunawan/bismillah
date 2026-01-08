const pool = require('./db');

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      stock INT DEFAULT 0,
      unit VARCHAR(50) NOT NULL
    );
  `);
};

module.exports = { createTables };
