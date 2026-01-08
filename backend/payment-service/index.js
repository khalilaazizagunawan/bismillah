const express = require('express');
const cors = require('cors');
const axios = require('axios');
const pool = require('./db');
const { createTables } = require('./schema');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4004;

/* =============================
   INIT DATABASE TABLES
============================= */
(async function initDatabase() {
  try {
    console.log('📦 Initializing Payment Service database...');
    await createTables();
  } catch (err) {
    console.error('❌ Failed to initialize Payment tables:', err);
    process.exit(1);
  }
})();

/* =============================
   GET ALL PAYMENTS (Tagihan dari Supplier)
============================= */
app.get('/payments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments ORDER BY created_at DESC');
    res.json(rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      supplierName: row.supplier_name,
      items: row.items,
      amount: Number(row.amount),
      status: row.status,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      createdAt: row.created_at
    })));
  } catch (err) {
    console.error('GET /payments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =============================
   GET PAYMENT BY ID
============================= */
app.get('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const row = rows[0];
    res.json({
      id: row.id,
      invoiceNumber: row.invoice_number,
      supplierName: row.supplier_name,
      items: row.items,
      amount: Number(row.amount),
      status: row.status,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error('GET /payments/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =============================
   CREATE PAYMENT (Terima tagihan dari Supplier)
   Dipanggil oleh webhook dari Supplier
============================= */
app.post('/payments', async (req, res) => {
  try {
    const { invoiceNumber, supplierName, items, amount, dueDate } = req.body;
    
    if (!invoiceNumber || amount === undefined) {
      return res.status(400).json({ error: 'invoiceNumber and amount are required' });
    }
    
    // Cek apakah invoice sudah ada
    const existing = await pool.query('SELECT id FROM payments WHERE invoice_number = $1', [invoiceNumber]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Invoice already exists' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO payments (invoice_number, supplier_name, items, amount, due_date) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [invoiceNumber, supplierName, JSON.stringify(items), amount, dueDate]
    );
    
    const row = rows[0];
    res.status(201).json({
      id: row.id,
      invoiceNumber: row.invoice_number,
      supplierName: row.supplier_name,
      items: row.items,
      amount: Number(row.amount),
      status: row.status,
      dueDate: row.due_date,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error('POST /payments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =============================
   UPDATE PAYMENT
============================= */
app.put('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceNumber, supplierName, items, amount, status, dueDate } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (invoiceNumber !== undefined) {
      updates.push(`invoice_number = $${paramCount++}`);
      values.push(invoiceNumber);
    }
    if (supplierName !== undefined) {
      updates.push(`supplier_name = $${paramCount++}`);
      values.push(supplierName);
    }
    if (items !== undefined) {
      updates.push(`items = $${paramCount++}`);
      values.push(JSON.stringify(items));
    }
    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(amount);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(dueDate);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const query = `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const row = rows[0];
    res.json({
      id: row.id,
      invoiceNumber: row.invoice_number,
      supplierName: row.supplier_name,
      items: row.items,
      amount: Number(row.amount),
      status: row.status,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error('PUT /payments/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =============================
   PAY PAYMENT - BAYAR TAGIHAN
   Ketika klik "Bayar":
   1. Update status jadi PAID
   2. OTOMATIS update Inventory dengan bahan yang dibeli
============================= */
app.post('/payments/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get payment data
    const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const payment = rows[0];
    
    if (payment.status === 'PAID') {
      return res.status(400).json({ error: 'Payment already paid' });
    }
    
    // Update status to PAID
    const updateResult = await pool.query(
      `UPDATE payments SET status = 'PAID', paid_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    
    const row = updateResult.rows[0];
    
    // ============================================
    // OTOMATIS UPDATE INVENTORY dengan bahan yang dibeli
    // ============================================
    const items = payment.items;
    const inventoryUpdates = [];
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        try {
          // Cek apakah bahan sudah ada di inventory
          const existingItem = await axios.get(`http://inventory:4002/inventory`);
          const existing = existingItem.data.find(inv => 
            inv.name.toLowerCase() === item.name.toLowerCase()
          );
          
          if (existing) {
            // Update stok yang sudah ada (tambah stok)
            const newStock = existing.stock + (item.qty || 0);
            await axios.put(`http://inventory:4002/inventory/${existing.id}`, {
              stock: newStock
            });
            inventoryUpdates.push({
              action: 'updated',
              name: item.name,
              previousStock: existing.stock,
              addedStock: item.qty,
              newStock: newStock,
              unit: item.unit || existing.unit
            });
          } else {
            // Tambah bahan baru ke inventory
            await axios.post('http://inventory:4002/inventory', {
              name: item.name,
              stock: item.qty || 0,
              unit: item.unit || 'pcs'
            });
            inventoryUpdates.push({
              action: 'created',
              name: item.name,
              stock: item.qty,
              unit: item.unit || 'pcs'
            });
          }
        } catch (invErr) {
          console.error(`Failed to update inventory for ${item.name}:`, invErr.message);
          inventoryUpdates.push({
            action: 'failed',
            name: item.name,
            error: invErr.message
          });
        }
      }
    }
    
    res.json({
      message: 'Pembayaran berhasil! Stok inventory telah diupdate.',
      payment: {
        id: row.id,
        invoiceNumber: row.invoice_number,
        supplierName: row.supplier_name,
        items: row.items,
        amount: Number(row.amount),
        status: row.status,
        paidAt: row.paid_at,
        createdAt: row.created_at
      },
      inventoryUpdates: inventoryUpdates
    });
  } catch (err) {
    console.error('POST /payments/:id/pay error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =============================
   DELETE PAYMENT
============================= */
app.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ message: 'Payment deleted successfully', payment: rows[0] });
  } catch (err) {
    console.error('DELETE /payments/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =============================
   HEALTH CHECK
============================= */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'payment-service',
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'payment-service',
      database: 'disconnected',
      error: err.message
    });
  }
});

/* =============================
   START SERVER
============================= */
app.listen(PORT, () => {
  console.log(`🚀 Payment service running on port ${PORT}`);
});
