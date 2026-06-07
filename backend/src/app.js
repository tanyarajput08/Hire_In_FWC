const express = require("express");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://hire-in-fwc.vercel.app/",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const healthRoutes = require("./routes/healthRoutes");
app.use("/", healthRoutes);

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api", jobRoutes);
app.use("/api", applicationRoutes);

module.exports = app;
