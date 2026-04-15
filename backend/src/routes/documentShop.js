const express = require('express');
const { param } = require('express-validator');
const multer = require('multer');
const router = express.Router();
const documentShopController = require('../controllers/documentShopController');
const AuthMiddleware = require('../middleware/auth');

// Multer config: memory storage — files stored in DB, no filesystem needed on Vercel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB (Vercel serverless body limit)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo file PDF sono ammessi'), false);
    }
  }
});

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

// Upload document
router.post('/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  upload.single('file'),
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
