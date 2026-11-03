import { authRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { Router } from 'express';
import { register, login, getMe, sendInviteEmail } from '../controllers/authController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', authRateLimiter, validateBody(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Log in user and return JWT
 * @access  Public
 */
router.post('/login', authRateLimiter, validateBody(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/send-invite
 * @desc    Dispatch corporate workspace invitation email with secure activation link
 * @access  Public
 */
router.post('/send-invite', sendInviteEmail);

export default router;
