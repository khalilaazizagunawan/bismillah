const express = require('express');
const cors = require('cors');
const { createTables } = require('./schema');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4005;

/* ==============================
   INIT DATABASE
============================== */
(async () => {
  try {
    await createTables();
    console.log('✅ Order tables ready');
  } catch (err) {
    console.error('❌ Failed creating order tables:', err);
    process.exit(1);
  }
})();

/* ==============================
   GET ALL ORDERS
============================== */
app.get('/orders', async (req, res) => {
  try {
    const ordersRes = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = [];

    for (const order of ordersRes.rows) {
      const itemsRes = await pool.query(
        'SELECT id, cake_id, name, qty, price, subtotal FROM order_items WHERE order_id = $1',
        [order.id]
      );

      orders.push({
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        items: itemsRes.rows
      });
    }

    res.json(orders);
  } catch (err) {
    console.error('GET /orders error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   GET ORDER BY ID
============================== */
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];
    const itemsRes = await pool.query(
      'SELECT id, cake_id, name, qty, price, subtotal FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.json({
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      items: itemsRes.rows
    });
  } catch (err) {
    console.error('GET /orders/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   CREATE ORDER
============================== */
app.post('/orders', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_address, items } = req.body;

    if (!customer_name || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'customer_name and items array are required' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const orderRes = await pool.query(
      'INSERT INTO orders(customer_name, customer_phone, customer_address, total) VALUES($1, $2, $3, $4) RETURNING *',
      [customer_name, customer_phone || '', customer_address || '', total]
    );

    const order = orderRes.rows[0];

    const insertedItems = [];
    for (const item of items) {
      const subtotal = item.qty * item.price;
      const itemRes = await pool.query(
        `INSERT INTO order_items(order_id, cake_id, name, qty, price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [order.id, item.cake_id || null, item.name, item.qty, item.price, subtotal]
      );
      insertedItems.push(itemRes.rows[0]);
    }

    res.status(201).json({
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      items: insertedItems
    });
  } catch (err) {
    console.error('POST /orders error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   UPDATE ORDER
============================== */
app.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_phone, customer_address, status, items } = req.body;

    // Check if order exists
    const existingOrder = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Build dynamic update query for order
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (customer_name !== undefined) {
      updates.push(`customer_name = $${paramCount++}`);
      values.push(customer_name);
    }
    if (customer_phone !== undefined) {
      updates.push(`customer_phone = $${paramCount++}`);
      values.push(customer_phone);
    }
    if (customer_address !== undefined) {
      updates.push(`customer_address = $${paramCount++}`);
      values.push(customer_address);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }

    let order = existingOrder.rows[0];

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);
      order = result.rows[0];
    }

    // If items provided, replace all items
    if (items && Array.isArray(items)) {
      await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);

      // Recalculate total
      const newTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
      await pool.query('UPDATE orders SET total = $1 WHERE id = $2', [newTotal, id]);
      order.total = newTotal;

      for (const item of items) {
        const subtotal = item.qty * item.price;
        await pool.query(
          `INSERT INTO order_items(order_id, cake_id, name, qty, price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, item.cake_id || null, item.name, item.qty, item.price, subtotal]
        );
      }
    }

    // Fetch updated items
    const itemsRes = await pool.query(
      'SELECT id, cake_id, name, qty, price, subtotal FROM order_items WHERE order_id = $1',
      [id]
    );

    res.json({
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
      items: itemsRes.rows
    });
  } catch (err) {
    console.error('PUT /orders/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   DELETE ORDER
============================== */
app.delete('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // order_items will be deleted automatically due to ON DELETE CASCADE
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (err) {
    console.error('DELETE /orders/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ==============================
   HEALTH CHECK
============================== */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'order-service', database: 'connected' });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'order-service',
      database: 'disconnected',
      error: err.message,
    });
  }
});

/* ==============================
   START SERVER
============================== */
app.listen(PORT, () =>
  console.log(`🚀 Order service running on port ${PORT}`)
);
