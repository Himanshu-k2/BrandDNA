import { Router } from 'express';
import { chatRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { chatWithBrad } from '../controllers/chatController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { chatSchema } from '../validators/chatValidators.js';

const router = Router();

// Public/session route for interacting with the Brad AI assistant
router.post('/brad', chatRateLimiter, validateBody(chatSchema), chatWithBrad);

export default router;
