const express = require("express");
const cors = require("cors");

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Root health route
app.get("/", (req, res) => {
  res.json({ status: "Backend is running 🚀" });
});

// Routes
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api", jobRoutes);
app.use("/api", applicationRoutes);

module.exports = app;