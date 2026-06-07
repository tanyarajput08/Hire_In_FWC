require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 5000;
const jobRoutes =
require("./src/routes/jobRoutes");
app.use("/api", jobRoutes);
const resumeRoutes =
require("./src/routes/resumeRoutes");

app.use("/api", resumeRoutes);

const screeningRoutes = require("./src/routes/screeningRoutes");
app.use("/api", screeningRoutes);

const rankingRoutes = require("./src/routes/rankingRoutes");
app.use("/api", rankingRoutes);

const bulkScreeningRoutes = require("./src/routes/bulkScreeningRoutes");
app.use("/api", bulkScreeningRoutes);

const interviewRoutes = require("./src/routes/interviewRoutes");
app.use("/api", interviewRoutes);

const assistantRoutes = require("./src/routes/assistantRoutes");
app.use("/api", assistantRoutes);

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
