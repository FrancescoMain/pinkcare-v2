const express = require('express');
const { param, body } = require('express-validator');
const multer = require('multer');
const router = express.Router();
const hospitalizationController = require('../controllers/hospitalizationController');
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

// Generate code and download PDF
router.post('/generate-code-pdf',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    body('name').notEmpty().withMessage('Il nome è obbligatorio'),
    body('surname').notEmpty().withMessage('Il cognome è obbligatorio'),
    body('codFisc').notEmpty().withMessage('Il codice fiscale è obbligatorio')
  ],
  hospitalizationController.generateCodePdf
);

// Verify code for consumer authorization
router.post('/verify-code',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireConsumer,
  [
    body('businessId').notEmpty().withMessage('Il business ID è obbligatorio'),
    body('codice').notEmpty().withMessage('Il codice è obbligatorio'),
    body('codFisc').notEmpty().withMessage('Il codice fiscale è obbligatorio')
  ],
  hospitalizationController.verifyCode
);

module.exports = router;
