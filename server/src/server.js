
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool, testConnection } = require("./config/db");

const candidatesRouter = require("./routes/candidates");
const jobsRouter = require("./routes/jobs");
const applicationsRouter = require("./routes/applications");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://mini-applicant-tracking-system-ats.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header,
      // such as server-to-server requests and health checks.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS rejected origin:", origin);

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "HireFlow ATS API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check database error:", error.message);

    res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
});

// API routes
app.use("/api/candidates", candidatesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applications", applicationsRouter);

// Dashboard metrics
app.get("/api/dashboard", async (req, res, next) => {
  try {
    const [[candidateResult]] = await pool.query(
      "SELECT COUNT(*) AS total FROM candidates"
    );

    const [[applicationResult]] = await pool.query(
      "SELECT COUNT(*) AS total FROM applications"
    );

    const [stageRows] = await pool.query(
      `SELECT stage, COUNT(*) AS total
       FROM applications
       GROUP BY stage`
    );

    const [[jobResult]] = await pool.query(
      "SELECT COUNT(*) AS total FROM jobs"
    );

    res.status(200).json({
      success: true,
      data: {
        totalCandidates: candidateResult.total,
        totalApplications: applicationResult.total,
        totalJobs: jobResult.total,
        applicationsByStage: stageRows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error("API error:", err.message);

  // Handle CORS errors explicitly
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed by CORS",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/**
 * Start the server locally.
 * On Vercel, export the Express app for serverless handling.
 */
async function startServer() {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`HireFlow ATS API: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to connect to MySQL:", error.message);
    await pool.end();
    process.exit(1);
  }
}

if (process.env.VERCEL) {
  module.exports = app;
} else {
  module.exports = app;
  startServer();
}
