const { Pool } = require("pg");

/* =============================
   DATABASE CONNECTION
============================= */
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "toko_kue_postgres",
  user: process.env.POSTGRES_USER || "toko_user",
  password: process.env.POSTGRES_PASSWORD || "secret123",
  database: process.env.POSTGRES_DB || "inventory_db",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/* =============================
   TEST CONNECTION ON STARTUP
============================= */
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("📦 Inventory DB connected");
  } catch (err) {
    console.error("❌ Inventory DB connection failed:", err.message);
    setTimeout(async () => {
      try {
        await pool.query("SELECT 1");
        console.log("📦 Inventory DB connected (retry)");
      } catch (retryErr) {
        console.error("❌ Inventory DB connection failed on retry:", retryErr.message);
        process.exit(1);
      }
    }, 5000);
  }
})();

/* =============================
   GRACEFUL SHUTDOWN
============================= */
process.on("SIGTERM", async () => {
  console.log("🔻 Closing Inventory DB pool...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔻 Closing Inventory DB pool...");
  await pool.end();
  process.exit(0);
});

module.exports = pool;
