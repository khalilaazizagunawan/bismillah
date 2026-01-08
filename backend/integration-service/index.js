const express = require('express');
const cors = require('cors');
const axios = require('axios');
const pool = require('./db');
const { createTables } = require('./schema');

const app = express();
const PORT = 4006;

// Middleware
app.use(cors());
app.use(express.json());

// URL Toko Bahan Kue (Kelompok Lain / Supplier)
const SUPPLIER_API_URL = process.env.SUPPLIER_API_URL || 'http://localhost:5000';
const TELLYOU_STOCK_PAYMENT_URL = process.env.TELLYOU_STOCK_PAYMENT_URL || 'http://stock-payment-service:3000/graphql';

/* =============================
   DATABASE INITIALIZATION
============================= */
(async () => {
  try {
    await createTables();
    console.log('📦 Integration tables ready');
  } catch (err) {
    console.error('❌ Failed to create integration tables:', err.message);
    process.exit(1);
  }
})();

/* =============================
   HELPER: Log Integration
============================= */
const logIntegration = async (direction, endpoint, method, requestBody, responseBody, statusCode) => {
  try {
    await pool.query(
      `INSERT INTO integration_logs (direction, endpoint, method, request_body, response_body, status_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [direction, endpoint, method, JSON.stringify(requestBody), JSON.stringify(responseBody), statusCode]
    );
  } catch (err) {
    console.error('Failed to log integration:', err.message);
  }
};

/* ==========================================================
   OUTGOING: API untuk MEMANGGIL Toko Bahan Kue (Supplier)
   Toko Kue (Anda) → Toko Bahan Kue (Kelompok Lain)
========================================================== */

/**
 * GET /api/supplier/catalog
 * Melihat katalog bahan dari Toko Bahan Kue (Kelompok Lain)
 */
app.get('/api/supplier/catalog', async (req, res) => {
  try {
    const { data } = await axios.get(`${SUPPLIER_API_URL}/api/catalog`);

    await logIntegration('OUTGOING', '/api/catalog', 'GET', null, data, 200);

    res.json({
      success: true,
      message: 'Katalog dari Toko Bahan Kue (Supplier)',
      data: data.data || data
    });
  } catch (err) {
    console.error('GET /api/supplier/catalog error:', err.message);

    // Jika supplier belum tersedia, return mock data untuk testing
    res.json({
      success: false,
      message: 'Tidak dapat terhubung ke Toko Bahan Kue. Pastikan supplier sudah online.',
      error: err.message,
      supplierUrl: SUPPLIER_API_URL
    });
  }
});

/**
 * GET /api/supplier/inventory
 * Cek ketersediaan stok dari Toko Bahan Kue
 */
app.get('/api/supplier/inventory', async (req, res) => {
  try {
    const { data } = await axios.get(`${SUPPLIER_API_URL}/api/inventory/check`);

    await logIntegration('OUTGOING', '/api/inventory/check', 'GET', null, data, 200);

    res.json({
      success: true,
      message: 'Stok tersedia dari Toko Bahan Kue',
      data: data.data || data
    });
  } catch (err) {
    console.error('GET /api/supplier/inventory error:', err.message);
    res.json({
      success: false,
      message: 'Tidak dapat terhubung ke Toko Bahan Kue',
      error: err.message
    });
  }
});

/**
 * POST /api/supplier/orders
 * Toko Kue (Anda) membuat order bahan ke Toko Bahan Kue (Supplier)
 */
app.post('/api/supplier/orders', async (req, res) => {
  try {
    const { items, notes } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'items array is required'
      });
    }

    // Hitung total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.price || 0) * (item.qty || 0);
    }

    // Kirim order ke supplier (Toko Bahan Kue)
    const orderPayload = {
      customerGroup: 'Toko Kue',
      customerName: process.env.STORE_NAME || 'Toko Kue Anda',
      items,
      notes
    };

    let supplierResponse = null;
    let invoiceNumber = null;

    try {
      const { data } = await axios.post(`${SUPPLIER_API_URL}/api/external/orders`, orderPayload);
      supplierResponse = data;
      invoiceNumber = data.data?.invoiceNumber;

      await logIntegration('OUTGOING', '/api/external/orders', 'POST', orderPayload, data, 201);
    } catch (supplierErr) {
      console.error('Failed to send order to supplier:', supplierErr.message);
      // Tetap simpan order lokal meskipun gagal kirim ke supplier
    }

    // Simpan order ke database lokal
    const { rows } = await pool.query(
      `INSERT INTO supplier_orders (items, total_amount, notes, supplier_invoice, supplier_response)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [JSON.stringify(items), totalAmount, notes, invoiceNumber, JSON.stringify(supplierResponse)]
    );

    const order = rows[0];

    res.status(201).json({
      success: true,
      message: supplierResponse ? 'Order berhasil dikirim ke Toko Bahan Kue' : 'Order disimpan lokal (supplier offline)',
      data: {
        id: order.id,
        items: order.items,
        totalAmount: Number(order.total_amount),
        status: order.status,
        supplierInvoice: invoiceNumber,
        createdAt: order.created_at
      }
    });
  } catch (err) {
    console.error('POST /api/supplier/orders error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

/**
 * POST /api/tellyou/order
 * Integrasi Baru: Toko Kue kirim order ke Tellyou via GraphQL (Stock Payment Service)
 */
app.post('/api/tellyou/order', async (req, res) => {
  const { externalOrderId, items, totalAmount } = req.body;

  // Format data untuk GraphQL Tellyou
  const graphqlQuery = {
    query: `
      mutation CreateTellyouTransaction($input: OrderInput!) {
        createTransaction(input: $input) {
          success
          transaction_id
          order_id
          total_cost
          payment_status
          message
        }
      }
    `,
    variables: {
      input: {
        external_order_id: externalOrderId || `TK-${Date.now()}`,
        source_system: "TOKO_KUE_APP",
        items: items.map(item => ({
          product_id: String(item.id || item.product_id),
          quantity: parseInt(item.qty || item.quantity),
          price: parseFloat(item.price)
        })),
        total_amount: parseFloat(totalAmount)
      }
    }
  };

  try {
    const { data } = await axios.post(TELLYOU_STOCK_PAYMENT_URL, graphqlQuery);

    await logIntegration('OUTGOING', '/graphql', 'POST', graphqlQuery, data, 200);

    if (data.errors) {
      return res.status(400).json({
        success: false,
        message: 'GraphQL Error dari Tellyou',
        errors: data.errors
      });
    }

    res.json({
      success: true,
      message: 'Berhasil integrasi ke Tellyou (GraphQL)',
      tellyouData: data.data.createTransaction
    });
  } catch (err) {
    console.error('Tellyou Integration Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke Tellyou Stock Payment Service',
      error: err.message,
      targetUrl: TELLYOU_STOCK_PAYMENT_URL
    });
  }
});

/**
 * POST /api/supplier/payments
 * Toko Kue (Anda) membayar tagihan ke Toko Bahan Kue
 */
app.post('/api/supplier/payments', async (req, res) => {
  try {
    const { orderId, invoiceNumber, amount, paymentMethod } = req.body;

    if (!invoiceNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: 'invoiceNumber and amount are required'
      });
    }

    // Kirim konfirmasi pembayaran ke supplier
    const paymentPayload = {
      invoiceNumber,
      amount,
      paymentMethod: paymentMethod || 'Transfer Bank',
      transactionId: `TXN-${Date.now()}`
    };

    let supplierResponse = null;

    try {
      const { data } = await axios.post(`${SUPPLIER_API_URL}/api/external/payments`, paymentPayload);
      supplierResponse = data;

      await logIntegration('OUTGOING', '/api/external/payments', 'POST', paymentPayload, data, 200);
    } catch (supplierErr) {
      console.error('Failed to send payment to supplier:', supplierErr.message);
    }

    // Update order lokal
    if (orderId) {
      await pool.query(
        `UPDATE supplier_orders SET status = 'PAID', paid_at = NOW() WHERE id = $1`,
        [orderId]
      );
    }

    res.json({
      success: true,
      message: supplierResponse ? 'Pembayaran berhasil dikirim ke Toko Bahan Kue' : 'Pembayaran disimpan lokal (supplier offline)',
      data: {
        invoiceNumber,
        amount,
        status: 'PAID',
        paidAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('POST /api/supplier/payments error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

/**
 * GET /api/supplier/orders
 * Lihat semua order yang sudah dibuat ke supplier
 */
app.get('/api/supplier/orders', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM supplier_orders ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: rows.map(order => ({
        id: order.id,
        items: order.items,
        totalAmount: Number(order.total_amount),
        status: order.status,
        supplierInvoice: order.supplier_invoice,
        notes: order.notes,
        paidAt: order.paid_at,
        receivedAt: order.received_at,
        createdAt: order.created_at
      }))
    });
  } catch (err) {
    console.error('GET /api/supplier/orders error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

/**
 * GET /api/supplier/orders/:id
 * Detail order ke supplier
 */
app.get('/api/supplier/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM supplier_orders WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = rows[0];
    res.json({
      success: true,
      data: {
        id: order.id,
        items: order.items,
        totalAmount: Number(order.total_amount),
        status: order.status,
        supplierInvoice: order.supplier_invoice,
        notes: order.notes,
        paidAt: order.paid_at,
        receivedAt: order.received_at,
        createdAt: order.created_at
      }
    });
  } catch (err) {
    console.error('GET /api/supplier/orders/:id error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
});

/* ==========================================================
   INCOMING: Endpoint untuk MENERIMA data dari Toko Bahan Kue
   Toko Bahan Kue (Supplier) → Toko Kue (Anda)
========================================================== */

/**
 * POST /api/webhook/invoice
 * Menerima tagihan/invoice dari Toko Bahan Kue (Supplier)
 * Tagihan akan otomatis masuk ke Payment Service
 */
app.post('/api/webhook/invoice', async (req, res) => {
  try {
    const { invoiceNumber, supplierName, orderId, amount, dueDate, items } = req.body;

    await logIntegration('INCOMING', '/api/webhook/invoice', 'POST', req.body, null, 200);

    // Parse orderId - jika string bukan angka, set null
    const parsedOrderId = orderId && !isNaN(parseInt(orderId)) ? parseInt(orderId) : null;

    // Simpan invoice yang diterima di integration service
    await pool.query(
      `INSERT INTO received_invoices (invoice_number, supplier_order_id, amount, due_date, items)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (invoice_number) DO UPDATE SET amount = $3, due_date = $4`,
      [invoiceNumber, parsedOrderId, amount, dueDate, JSON.stringify(items)]
    );

    // ============================================
    // KIRIM TAGIHAN KE PAYMENT SERVICE
    // Agar muncul di halaman Payment untuk dibayar
    // ============================================
    try {
      await axios.post('http://payment:4004/payments', {
        invoiceNumber,
        supplierName: supplierName || 'Toko Bahan Kue',
        items,
        amount,
        dueDate
      });
      console.log(`✅ Tagihan ${invoiceNumber} berhasil dikirim ke Payment Service`);
    } catch (paymentErr) {
      console.error('Failed to create payment:', paymentErr.message);
    }

    res.json({
      success: true,
      message: 'Invoice diterima dan tagihan telah dibuat'
    });
  } catch (err) {
    console.error('POST /api/webhook/invoice error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to receive invoice' });
  }
});

/**
 * POST /api/webhook/inventory-update
 * Menerima update inventory dari Tellyou
 * Tellyou → Toko Kue: Update stok bahan otomatis
 */
app.post('/api/webhook/inventory-update', async (req, res) => {
  try {
    const { items, source, notes } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'items array is required'
      });
    }

    await logIntegration('INCOMING', '/api/webhook/inventory-update', 'POST', req.body, null, 200);

    const updateResults = [];

    // Update setiap item di inventory Toko Kue
    for (const item of items) {
      try {
        const { name, quantityChange, unit } = item;

        // Cari inventory berdasarkan nama
        const { rows: existingItems } = await pool.query(
          `SELECT * FROM inventory WHERE LOWER(name) = LOWER($1)`,
          [name]
        );

        if (existingItems.length > 0) {
          // Update existing inventory via Inventory Service
          const inventoryItem = existingItems[0];
          const response = await axios.put(`http://inventory:4002/inventory/${inventoryItem.id}`, {
            stock: inventoryItem.stock + quantityChange
          });

          updateResults.push({
            name,
            action: 'UPDATED',
            previousStock: inventoryItem.stock,
            change: quantityChange,
            newStock: inventoryItem.stock + quantityChange
          });

          console.log(`✅ Updated inventory: ${name} (${inventoryItem.stock} → ${inventoryItem.stock + quantityChange})`);
        } else {
          // Create new inventory item if not exists
          const response = await axios.post('http://inventory:4002/inventory', {
            name,
            stock: Math.max(0, quantityChange),
            unit: unit || 'pcs'
          });

          updateResults.push({
            name,
            action: 'CREATED',
            previousStock: 0,
            change: quantityChange,
            newStock: Math.max(0, quantityChange)
          });

          console.log(`✅ Created new inventory: ${name} with stock ${Math.max(0, quantityChange)}`);
        }
      } catch (itemErr) {
        console.error(`Failed to update inventory for ${item.name}:`, itemErr.message);
        updateResults.push({
          name: item.name,
          action: 'FAILED',
          error: itemErr.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Inventory update received from Tellyou',
      source: source || 'TELLYOU',
      notes,
      results: updateResults
    });
  } catch (err) {
    console.error('POST /api/webhook/inventory-update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process inventory update' });
  }
});

/**
 * POST /api/webhook/shipment
 * Menerima notifikasi pengiriman dari Toko Bahan Kue
 */
app.post('/api/webhook/shipment', async (req, res) => {
  try {
    const { orderId, invoiceNumber, status, trackingNumber, shippedAt } = req.body;

    await logIntegration('INCOMING', '/api/webhook/shipment', 'POST', req.body, null, 200);

    // Update status order lokal
    if (invoiceNumber) {
      await pool.query(
        `UPDATE supplier_orders SET status = $1 WHERE supplier_invoice = $2`,
        [status || 'SHIPPED', invoiceNumber]
      );
    }

    res.json({
      success: true,
      message: 'Notifikasi pengiriman diterima',
      data: { trackingNumber, status }
    });
  } catch (err) {
    console.error('POST /api/webhook/shipment error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to receive shipment notification' });
  }
});

/**
 * PUT /api/webhook/purchase-order/:id/status
 * Supplier (Toko Bahan Kue) update status purchase order
 * Hanya supplier yang bisa akses endpoint ini (via webhook)
 */
app.put('/api/webhook/purchase-order/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }

    await logIntegration('INCOMING', `/api/webhook/purchase-order/${id}/status`, 'PUT', req.body, null, 200);

    // Update purchase order status via procurement service
    try {
      const { data } = await axios.put(`http://procurement:4003/pos/${id}`, { status });

      res.json({
        success: true,
        message: 'Purchase order status updated successfully',
        data: {
          id: data.id,
          status: data.status,
          supplier: data.supplier,
          createdAt: data.createdAt
        }
      });
    } catch (procErr) {
      if (procErr.response?.status === 404) {
        return res.status(404).json({ success: false, error: 'Purchase order not found' });
      }
      throw procErr;
    }
  } catch (err) {
    console.error('PUT /api/webhook/purchase-order/:id/status error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update purchase order status' });
  }
});

/**
 * POST /api/webhook/delivery
 * Konfirmasi barang diterima (dipanggil oleh Toko Kue sendiri)
 */
app.post('/api/supplier/orders/:id/receive', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE supplier_orders SET status = 'RECEIVED', received_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Update inventory lokal dengan barang yang diterima
    const order = rows[0];
    const items = order.items;

    if (Array.isArray(items)) {
      for (const item of items) {
        try {
          // Tambah ke inventory lokal
          await axios.post('http://inventory:4002/inventory', {
            name: item.name,
            stock: item.qty,
            unit: item.unit || 'pcs'
          });
        } catch (invErr) {
          console.error('Failed to update inventory:', invErr.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Barang diterima dan stok inventory diupdate',
      data: {
        id: order.id,
        status: 'RECEIVED',
        receivedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('POST /api/supplier/orders/:id/receive error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to confirm receipt' });
  }
});

/**
 * GET /api/received-invoices
 * Lihat semua invoice yang diterima dari supplier
 */
app.get('/api/received-invoices', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM received_invoices ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: rows.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        amount: Number(inv.amount),
        status: inv.status,
        dueDate: inv.due_date,
        paidAt: inv.paid_at,
        createdAt: inv.created_at
      }))
    });
  } catch (err) {
    console.error('GET /api/received-invoices error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get invoices' });
  }
});

/**
 * GET /api/integration-logs
 * Lihat log integrasi
 */
app.get('/api/integration-logs', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT 100'
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    console.error('GET /api/integration-logs error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
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
      service: 'integration-service',
      database: 'connected',
      supplierUrl: SUPPLIER_API_URL
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'integration-service',
      database: 'disconnected',
      error: err.message
    });
  }
});

/* =============================
   START SERVER
============================= */
app.listen(PORT, () => {
  console.log(`🔗 Integration service running on port ${PORT}`);
  console.log(`📦 Supplier API URL: ${SUPPLIER_API_URL}`);
});
