import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, adminSecretKey, organizationId } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Role assignment & privilege escalation prevention
    const totalUsers = await User.countDocuments();
    let assignedRole = 'creator';

    if (totalUsers === 0) {
      // First user bootstrap pattern: initial user is granted admin
      assignedRole = 'admin';
    } else if (role && (role === 'admin' || role === 'reviewer')) {
      const configuredSecret = process.env.ADMIN_INVITE_SECRET;
      if (!configuredSecret || adminSecretKey !== configuredSecret) {
        return res.status(403).json({
          success: false,
          message:
            'Privilege escalation rejected: Assigning admin or reviewer role requires a valid admin secret key',
        });
      }
      assignedRole = role;
    }

    // Organization workspace assignment
    let assignedOrgId = organizationId;
    if (!assignedOrgId) {
      // Auto-assign new isolated workspace ID for self-registered users
      assignedOrgId = new mongoose.Types.ObjectId();
    } else if (totalUsers > 0) {
      // If joining an existing org, require admin approval or secret key
      const configuredSecret = process.env.ADMIN_INVITE_SECRET;
      if (adminSecretKey !== configuredSecret) {
        // Safe fallback: assign dedicated workspace rather than unauthorized attachment
        assignedOrgId = new mongoose.Types.ObjectId();
      }
    }

    // Create user (password is hashed by Mongoose pre-save hook)
    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: assignedRole,
      organizationId: assignedOrgId,
    });

    await user.save();

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      organizationId: user.organizationId.toString(),
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user and explicitly include passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your workspace administrator.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      organizationId: user.organizationId.toString(),
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (Requires valid JWT)
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toJSON(),
    },
  });
};
