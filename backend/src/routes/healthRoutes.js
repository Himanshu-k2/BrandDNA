import { Router } from 'express';
import { getDatabaseState } from '../config/db.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health check and diagnostic info
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbState = getDatabaseState();

  const healthData = {
    success: true,
    status: 'healthy',
    service: 'BrandDNA Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbState,
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(healthData);
});

export default router;
