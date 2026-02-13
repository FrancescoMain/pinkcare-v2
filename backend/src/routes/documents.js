const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();
const documentController = require('../controllers/documentController');
const AuthMiddleware = require('../middleware/auth');

/**
 * Document Routes (/api/documents)
 * All routes require authentication
 * Handles "My Documents" feature - clinic documents management
 */

// Get clinics that have documents for the current user (for filter dropdown)
// Must be defined BEFORE /:id routes to avoid param conflict
router.get('/clinics',
  AuthMiddleware.verifyToken,
  documentController.getDocumentClinics
);

// Get paginated documents for the current user
router.get('/',
  AuthMiddleware.verifyToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Pagina deve essere un intero positivo'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Dimensione pagina deve essere tra 1 e 100'),
    query('typology')
      .optional()
      .isInt().withMessage('Tipologia deve essere un intero'),
    query('clinicId')
      .optional()
      .isInt().withMessage('ID clinica deve essere un intero')
  ],
  documentController.getDocuments
);

// Download a document
router.get('/:id/download',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID documento deve essere un intero')
  ],
  documentController.downloadDocument
);

// Delete a document
router.delete('/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID documento deve essere un intero')
  ],
  documentController.deleteDocument
);

// Attach a document to an examination
router.post('/:id/attach/:examId',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt().withMessage('ID documento deve essere un intero'),
    param('examId')
      .isInt().withMessage('ID esame deve essere un intero')
  ],
  documentController.attachToExam
);

module.exports = router;
