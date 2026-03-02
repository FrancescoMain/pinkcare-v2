const express = require('express');
const { param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const documentShopController = require('../controllers/documentShopController');
const AuthMiddleware = require('../middleware/auth');

// Multer config for file uploads — use /tmp on Vercel (read-only filesystem)
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
  ? '/tmp/uploads/documentshop'
  : path.join(__dirname, '../../uploads/documentshop');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.trim().replace(/ /g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
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
