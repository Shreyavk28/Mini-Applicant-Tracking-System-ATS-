
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool, testConnection } = require("./config/db");

const candidatesRouter = require("./routes/candidates");
const jobsRouter = require("./routes/jobs");
const applicationsRouter = require("./routes/applications");

const app = express();
const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

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

    res.json({
      success: true,
      message: "HireFlow ATS API is running",
      database: "connected",
    });
  } catch (error) {
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

    res.json({
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

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start only after verifying the database connection
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

startServer();
