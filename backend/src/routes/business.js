const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const AuthMiddleware = require('../middleware/auth');

/**
 * Business Routes
 * All routes require authentication
 * Replicates legacy business_form.xhtml endpoints
 */

// Get complete business profile
router.get('/profile',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ROLE_BUSINESS', 'ROLE_PINKCARE']),
  businessController.getProfile
);

// Update profile fields (_to_validate)
router.put('/profile',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  businessController.updateProfile
);

// Update address (direct save)
router.put('/address',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  businessController.updateAddress
);

// Update examinations
router.put('/examinations',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  businessController.updateExaminations
);

// Update pathologies
router.put('/pathologies',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  businessController.updatePathologies
);

module.exports = router;
