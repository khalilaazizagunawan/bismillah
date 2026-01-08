const pool = require('./db');

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price INT DEFAULT 0,
      stock INT NOT NULL,
      unit VARCHAR(50) NOT NULL,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seeding: Only seed if the table is empty
  const res = await pool.query('SELECT COUNT(*) FROM products');
  const count = parseInt(res.rows[0].count);

  if (count === 0) {
    console.log('🌱 Table is empty, seeding from products.json...');
    const products = require('./products.json');
    for (const p of products) {
      try {
        await pool.query(
          'INSERT INTO products (name, description, price, stock, unit, image_url, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [p.name, p.description, p.price, p.stock, 'pcs', p.image_url, true]
        );
      } catch (e) {
        console.error(`Failed to seed ${p.name}:`, e.message);
      }
    }
    console.log('✅ Seeding completed');
  } else {
    console.log('📦 Database already has data, skipping seeding.');
  }
};

module.exports = { createTables };

