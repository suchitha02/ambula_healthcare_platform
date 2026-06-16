const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuthService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user (patient or doctor)
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    body('phone').optional().isMobilePhone(),
    body('role').isIn(['patient', 'doctor']).optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, name, phone, role = 'patient' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(password);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        phone,
        role
      });

      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          userId: user._id,
          email: user.email,
          role: user.role,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await AuthService.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const newAccessToken = AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (token revocation can be added later with Redis)
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

module.exports = router;