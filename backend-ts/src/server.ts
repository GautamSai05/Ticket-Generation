// src/server.ts
// Main Express server with middleware, CORS, rate limiting, and API key authentication

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import attendanceRouter from "./routes/attendance.js";

dotenv.config();

const app = express();

// Enable CORS for local development
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
}));

// Parse JSON bodies (limit to 5MB)
app.use(express.json({ limit: "5mb" }));

// Rate limiter: 20 requests per minute per IP for /attendance routes
const attendanceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// API key authentication middleware (optional, enabled if API_KEY is set)
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip auth if API_KEY is not configured
  if (!process.env.API_KEY) {
    return next();
  }

  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
  }
  next();
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount attendance routes with rate limiting and optional auth
app.use("/attendance", attendanceLimiter, authMiddleware, attendanceRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Attendance API: http://localhost:${PORT}/attendance/scan`);
  if (process.env.API_KEY) {
    console.log(`   API Key authentication: ENABLED`);
  } else {
    console.log(`   API Key authentication: DISABLED (set API_KEY in .env to enable)`);
  }
});