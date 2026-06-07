const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "https://hire-in-fwc.vercel.app"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Normalize trailing slash
    const cleanOrigin = origin.replace(/\/$/, "");
    
    // Check if local development
    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
    
    if (isLocal || allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Backend is running 🚀" });
});

// Import routes
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const screeningRoutes = require("./routes/screeningRoutes");
const rankingRoutes = require("./routes/rankingRoutes");
const bulkScreeningRoutes = require("./routes/bulkScreeningRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

// Health and Readiness
app.use("/", healthRoutes);

// Auth
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

// Protected/Dashboard
app.use("/api", protectedRoutes);
app.use("/", protectedRoutes);

// Jobs
app.use("/api", jobRoutes);
app.use("/", jobRoutes);

// Applications
app.use("/api", applicationRoutes);
app.use("/", applicationRoutes);

// Resumes
app.use("/api", resumeRoutes);
app.use("/", resumeRoutes);

// Screening
app.use("/api", screeningRoutes);
app.use("/", screeningRoutes);

// Rankings
app.use("/api", rankingRoutes);
app.use("/", rankingRoutes);

// Bulk Screening
app.use("/api", bulkScreeningRoutes);
app.use("/", bulkScreeningRoutes);

// Interviews
app.use("/api", interviewRoutes);
app.use("/", interviewRoutes);

// Assistant
app.use("/api", assistantRoutes);
app.use("/", assistantRoutes);

module.exports = app;