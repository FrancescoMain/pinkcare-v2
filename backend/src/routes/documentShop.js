const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const documentShopController = require('../controllers/documentShopController');
const AuthMiddleware = require('../middleware/auth');

/**
 * DocumentShop Routes
 * All routes require authentication + ROLE_BUSINESS
 */

// Autocomplete doctors (must be before /:id routes)
router.get('/doctors',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  documentShopController.searchDoctors
);

// Get paginated documents list
router.get('/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  documentShopController.getDocuments
);

// Get presigned upload URL for direct client→Supabase upload
router.get('/upload-url',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  documentShopController.getUploadUrl
);

// Save document metadata after direct Supabase upload (JSON, no file)
router.post('/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  documentShopController.uploadDocument
);

// Download a document
router.get('/:id/download',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID documento deve essere un intero')
  ],
  documentShopController.downloadDocument
);

// Delete a document
router.delete('/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID documento deve essere un intero')
  ],
  documentShopController.deleteDocument
);

module.exports = router;
