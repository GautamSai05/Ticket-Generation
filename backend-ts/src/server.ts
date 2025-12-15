// src/server.ts - Express server setup
// Main Express server with middleware, CORS, rate limiting, and API key authentication

import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import './firebaseConfig.js'; // Initialize Firebase
import attendanceRouter from './routes/attendance.ts';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many requests, please try again later.'
});

// Apply rate limiter to scan endpoint
app.use('/attendance/scan', limiter);

// Optional API key authentication
if (process.env.API_KEY) {
  app.use('/attendance', (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('x-api-key');
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/attendance', attendanceRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});