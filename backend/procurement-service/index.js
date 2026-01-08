const express = require("express");
const cors = require("cors");
const pool = require("./db");
const { createTables } = require("./schema");

const app = express();
const PORT = 4003;

app.use(cors());
app.use(express.json());

/* =============================
   DATABASE INITIALIZATION
============================= */
(async () => {
  try {
    await createTables();
    console.log("📦 Procurement tables created / already exist");
  } catch (err) {
    console.error("❌ Failed to create procurement tables:", err.message);
    process.exit(1);
  }
})();

/* =============================
   GET ALL PURCHASE ORDERS
============================= */
app.get("/pos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM purchase_orders ORDER BY created_at DESC"
    );
    res.json(result.rows.map(row => ({
      id: row.id,
      supplier: row.supplier,
      status: row.status,
      items: row.items,
      createdAt: row.created_at
    })));
  } catch (err) {
    console.error("GET /pos error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =============================
   GET PURCHASE ORDER BY ID
============================= */
app.get("/pos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Convert id to integer - handle both string and number
    const poId = parseInt(id);
    if (isNaN(poId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await pool.query(
      "SELECT * FROM purchase_orders WHERE id = $1",
      [poId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      supplier: row.supplier,
      status: row.status,
      items: row.items, // This is already JSON from database
      createdAt: row.created_at
    });
  } catch (err) {
    console.error("GET /pos/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =============================
   CREATE PURCHASE ORDER
============================= */
app.post("/pos", async (req, res) => {
  const { supplier, items } = req.body;

  if (!supplier || !items) {
    return res
      .status(400)
      .json({ error: "supplier and items are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO purchase_orders (supplier, items)
       VALUES ($1, $2)
       RETURNING *`,
      [supplier, JSON.stringify(items)]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      supplier: row.supplier,
      status: row.status,
      items: row.items,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error("POST /pos error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =============================
   UPDATE PURCHASE ORDER
============================= */
app.put("/pos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier, status, items } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (supplier !== undefined) {
      updates.push(`supplier = $${paramCount++}`);
      values.push(supplier);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (items !== undefined) {
      updates.push(`items = $${paramCount++}`);
      values.push(JSON.stringify(items));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const query = `UPDATE purchase_orders SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      supplier: row.supplier,
      status: row.status,
      items: row.items,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error("PUT /pos/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =============================
   DELETE PURCHASE ORDER
============================= */
app.delete("/pos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM purchase_orders WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json({ message: "Purchase order deleted successfully", purchaseOrder: result.rows[0] });
  } catch (err) {
    console.error("DELETE /pos/:id error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =============================
   HEALTH CHECK
============================= */
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      service: "procurement-service",
      database: "connected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      service: "procurement-service",
      database: "disconnected",
      error: err.message,
    });
  }
});

/* =============================
   START SERVER
============================= */
app.listen(PORT, () => {
  console.log(`🚚 Procurement service running on port ${PORT}`);
});
