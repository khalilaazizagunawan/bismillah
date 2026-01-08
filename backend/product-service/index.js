const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { createTables } = require('./schema');

const app = express();
app.use(cors());
// Increase body parser limit to handle base64 images (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

(async () => {
  try {
    console.log('📦 Creating product tables...');
    await createTables();
    console.log('✅ Product tables created');
  } catch (err) {
    console.error('❌ Failed to create product tables:', err);
  }
})();

/* ==============================
   GET ALL PRODUCTS
============================== */
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /products error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   GET PRODUCT BY ID
============================== */
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /products/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   CREATE PRODUCT
============================== */
app.post('/products', async (req, res) => {
  try {
    const { name, description, price, stock, unit, image_url, is_active } = req.body;

    if (!name || stock === undefined || !unit) {
      return res.status(400).json({ error: 'name, stock, and unit are required' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock, unit, image_url, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description || '', price || 0, stock, unit, image_url || '', is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /products error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   UPDATE PRODUCT
============================== */
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, unit, image_url, is_active } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramCount++}`);
      values.push(stock);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /products/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   DELETE PRODUCT
============================== */
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully', product: result.rows[0] });
  } catch (err) {
    console.error('DELETE /products/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   HEALTH CHECK
============================== */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'product-service',
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'product-service',
      database: 'disconnected',
      error: err.message
    });
  }
});

app.listen(4001, () => {
  console.log('🚀 Product service running on port 4001');
});
