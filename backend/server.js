require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 5000;

pool.connect()
  .then((client) => {
    console.log("PostgreSQL Connected");
    client.release();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.warn("Initial Database Connection Error:", err.message);
    console.warn("[WARNING] Starting server anyway; DB queries will fail until connection restored");
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (DB connection pending)`);
    });
  });

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  pool.end(() => {
    process.exit(0);
  });
});
