const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
  
  max: 20,
  idleTimeoutMillis: 30000,       
  connectionTimeoutMillis: 2000,  
  statement_timeout: 30000,       
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);

});

pool.on("connect", () => {
  console.log("New client connected to the pool");
});


pool.on("remove", () => {
  console.log("Client removed from the pool");
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await pool.end();
  console.log("Database connection pool closed");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server");
  await pool.end();
  console.log("Database connection pool closed");
  process.exit(0);
});

module.exports = pool;
