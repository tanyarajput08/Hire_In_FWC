const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl:
    process.env.DB_SSL === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.DB_HOST !== "localhost" &&
      process.env.DB_HOST !== "127.0.0.1")
      ? { rejectUnauthorized: false }
      : false,
});

// Handle unexpected pool errors to prevent server crash
pool.on("error", (err) => {
  console.error("Unexpected error in pool:", err);
});

module.exports = pool;