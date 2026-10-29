import dotenv from 'dotenv';

// Load environment variables before importing app and db
dotenv.config();

import app from './app.js';
import { connectDB, closeDB } from './config/db.js';

// Backend port is locked to 5001 for competition and frontend consistency
const PORT = process.env.PORT && process.env.PORT !== '5000' ? process.env.PORT : 5001;

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('Initial database connection error:', err.message);
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`🚀 BrandDNA API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${PORT}/api/health`);
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await closeDB();
    console.log('Process terminated cleanly.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exceptions & unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
