const express = require('express');
const authController = require('../controllers/authController');
const ValidationMiddleware = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Authentication routes
 * All routes are public (no auth middleware)
 */

/**
 * @route POST /api/auth/register-consumer
 * @desc Register new consumer user
 * @access Public
 */
router.post('/register-consumer', 
  ValidationMiddleware.validateRegistration,
  authController.registerConsumer.bind(authController)
);

/**
 * @route POST /api/auth/register-business
 * @desc Register new doctor/clinic user
 * @access Public
 */
router.post('/register-business',
  ValidationMiddleware.validateBusinessRegistration,
  authController.registerBusiness.bind(authController)
);

/**
 * @route POST /api/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login',
  ValidationMiddleware.validateLogin,
  authController.login.bind(authController)
);

/**
 * @route POST /api/auth/logout
 * @desc User logout
 * @access Public
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route POST /api/auth/forgot-password
 * @desc Initiate password recovery
 * @access Public
 */
router.post('/forgot-password',
  ValidationMiddleware.validateForgotPassword,
  authController.forgotPassword.bind(authController)
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with recovery token
 * @access Public
 */
router.post('/reset-password',
  ValidationMiddleware.validateResetPassword,
  authController.resetPassword.bind(authController)
);

/**
 * @route GET /api/auth/password-recovery
 * @desc Validate password recovery link (legacy format: userId$hash)
 * @access Public
 */
router.get('/password-recovery', authController.validateRecoveryLink.bind(authController));

/**
 * @route POST /api/auth/change-password
 * @desc Change password for authenticated user
 * @access Private (requires authentication)
 */
router.post('/change-password',
  authMiddleware,
  ValidationMiddleware.validateChangePassword,
  authController.changePassword.bind(authController)
);

/**
 * @route GET /api/auth/verify
 * @desc Verify JWT token
 * @access Public (token required)
 */
router.get('/verify', authController.verifyToken.bind(authController));

module.exports = router;
