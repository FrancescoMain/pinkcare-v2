const express = require('express');
const userController = require('../controllers/userController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * User management routes
 * All routes require authentication
 */

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile',
  AuthMiddleware.verifyToken,
  userController.getProfile
);

/**
 * @route PUT /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile',
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validateProfileUpdate,
  userController.updateProfile
);

/**
 * @route PUT /api/users/password
 * @desc Change user password
 * @access Private
 */
router.put('/password',
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validatePasswordChange,
  userController.changePassword
);

/**
 * @route POST /api/users/profile-image
 * @desc Upload profile image (base64)
 * @access Private
 */
router.post('/profile-image',
  AuthMiddleware.verifyToken,
  userController.uploadProfileImage
);

/**
 * @route GET /api/users/profile-image
 * @desc Get current profile image
 * @access Private
 */
router.get('/profile-image',
  AuthMiddleware.verifyToken,
  userController.getProfileImage
);

/**
 * @route GET /api/users/:userId
 * @desc Get user by ID (admin only or own profile)
 * @access Private - MUST BE LAST (catches all paths)
 */
router.get('/:userId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireOwnershipOrAdmin('userId'),
  userController.getUserById
);

module.exports = router;