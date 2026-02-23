const express = require('express');
const { param, body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const hospitalizationController = require('../controllers/hospitalizationController');
const AuthMiddleware = require('../middleware/auth');

// Multer config for file uploads — use /tmp on Vercel (read-only filesystem)
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
  ? '/tmp/uploads/hospitalization'
  : path.join(__dirname, '../../uploads/hospitalization');
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
 * Hospitalization Routes
 * All routes require authentication + ROLE_BUSINESS
 */

// Get paginated patients list
router.get('/patients',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  hospitalizationController.getPatients
);

// Approve a patient
router.post('/patients/:id/approve',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID paziente deve essere un intero')
  ],
  hospitalizationController.approvePatient
);

// Get documents for a patient
router.get('/patients/:id/documents',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID paziente deve essere un intero')
  ],
  hospitalizationController.getDocuments
);

// Upload document for a patient (PDF only)
router.post('/patients/:id/documents',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  upload.single('file'),
  hospitalizationController.uploadDocument
);

// Download a document
router.get('/documents/:id/download',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID documento deve essere un intero')
  ],
  hospitalizationController.downloadDocument
);

// Delete a document
router.delete('/documents/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID documento deve essere un intero')
  ],
  hospitalizationController.deleteDocument
);

// Generate code for a patient
router.post('/generate-code',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    body('name').notEmpty().withMessage('Il nome è obbligatorio'),
    body('surname').notEmpty().withMessage('Il cognome è obbligatorio'),
    body('codFisc').notEmpty().withMessage('Il codice fiscale è obbligatorio')
  ],
  hospitalizationController.generateCode
);

module.exports = router;
