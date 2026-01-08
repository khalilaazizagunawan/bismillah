const express = require('express');
const cors = require('cors');
const { createTables } = require('./schema');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4002;

(async () => {
  try {
    await createTables();
    console.log('✅ Inventory tables created');
  } catch (err) {
    console.error('❌ Failed to create inventory tables:', err);
  }
})();

/* ==============================
   GET ALL INVENTORY
============================== */
app.get('/inventory', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM inventory ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /inventory error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   GET INVENTORY BY ID
============================== */
app.get('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /inventory/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   CREATE INVENTORY
============================== */
app.post('/inventory', async (req, res) => {
  try {
    const { name, stock, unit } = req.body;
    
    if (!name || stock === undefined || !unit) {
      return res.status(400).json({ error: 'name, stock, and unit are required' });
    }
    
    const { rows } = await pool.query(
      'INSERT INTO inventory(name, stock, unit) VALUES($1, $2, $3) RETURNING *',
      [name, stock, unit]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /inventory error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   UPDATE INVENTORY
============================== */
app.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stock, unit } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramCount++}`);
      values.push(stock);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const query = `UPDATE inventory SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /inventory/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   DELETE INVENTORY
============================== */
app.delete('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json({ message: 'Inventory item deleted successfully', inventory: rows[0] });
  } catch (err) {
    console.error('DELETE /inventory/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   HEALTH CHECK
============================== */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'inventory-service', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'inventory-service', database: 'disconnected', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Inventory service running on port ${PORT}`);
});
