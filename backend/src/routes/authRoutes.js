import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Log in user and return JWT
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

export default router;
