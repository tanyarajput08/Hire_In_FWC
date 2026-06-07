const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({
      status: "OK",
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "ERROR",
      message: "Server health check failed",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    });
  }
});

// Detailed health check endpoint
router.get("/health/detailed", async (req, res) => {
  try {
    const dbCheck = await pool.query("SELECT NOW()");
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: "connected",
        checked: new Date().toISOString()
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB"
      },
      services: {
        gemini: process.env.GEMINI_API_KEY ? "configured" : "not configured",
        ai_engine_url: process.env.AI_ENGINE_URL || "not configured (using default http://127.0.0.1:8000)",
        cors: "enabled",
        authentication: "enabled"
      }
    });
  } catch (error) {
    console.error("Detailed health check failed:", error);
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: error.message
      }
    });
  }
});

// Ready check endpoint (used by Render for readiness probe)
router.get("/ready", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

module.exports = router;
