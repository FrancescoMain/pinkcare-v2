const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const hospitalizationController = require('../controllers/hospitalizationController');
const AuthMiddleware = require('../middleware/auth');

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

// Get presigned upload URL for direct-to-Supabase upload (bypasses Vercel body limit)
router.get('/patients/:id/upload-url',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  [
    param('id').isInt().withMessage('ID paziente deve essere un intero')
  ],
  hospitalizationController.getUploadUrl
);

// Save document metadata after direct Supabase upload (JSON, no file)
router.post('/patients/:id/documents',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireBusiness,
  hospitalizationController.uploadDocument
);

// Download a document (redirects to signed Supabase URL)
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
