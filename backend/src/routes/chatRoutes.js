import { chatRateLimiter } from '../middleware/rateLimitMiddleware.js';
import express from 'express';
import { chatWithBrad } from '../controllers/chatController.js';

const router = express.Router();

// Public/session route for interacting with the Brad AI assistant
router.post('/brad', chatRateLimiter, chatWithBrad);

export default router;

