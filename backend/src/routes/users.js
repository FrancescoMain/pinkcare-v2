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
 * @route GET /api/users/:userId
 * @desc Get user by ID (admin only or own profile)
 * @access Private
 */
router.get('/:userId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireOwnershipOrAdmin('userId'),
  userController.getUserById
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
 * DEBUG ONLY - TODO: REMOVE IN PRODUCTION
 * @route POST /api/users/debug/assign-all-roles
 * @desc Assign all roles to current user (for testing)
 * @access Private
 */
router.post('/debug/assign-all-roles',
  AuthMiddleware.verifyToken,
  userController.assignAllRoles
);

module.exports = router;