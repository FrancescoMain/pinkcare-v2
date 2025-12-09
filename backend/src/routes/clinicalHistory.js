const express = require('express');
const router = express.Router();
const clinicalHistoryController = require('../controllers/clinicalHistoryController');
const { body } = require('express-validator');
const AuthMiddleware = require('../middleware/auth');

/**
 * Clinical History Routes
 * All routes require authentication
 */

// Validation middleware
const validateConsumerUpdate = [
  body('representative.name').optional({ nullable: true }).isString().trim(),
  body('representative.surname').optional({ nullable: true }).isString().trim(),
  body('representative.email').optional({ nullable: true }).isEmail(),
  body('representative.birthday').optional({ nullable: true }).isISO8601(),
  body('representative.weight').optional({ nullable: true }).isFloat({ min: 0 }),
  body('representative.height').optional({ nullable: true }).isFloat({ min: 0 }),
  body('address.streetType').optional({ nullable: true }).isString(),
  body('address.street').optional({ nullable: true }).isString(),
  body('address.streetNumber').optional({ nullable: true }).isString()
];

/**
 * GET /api/clinical-history/download-pdf
 * Download clinical history as PDF
 * Main endpoint that replicates downloadConsumerDetails from Java
 */
router.get('/download-pdf', AuthMiddleware.verifyToken, clinicalHistoryController.downloadClinicalHistoryPDF);

/**
 * GET /api/clinical-history/surgeries
 * Get all surgeries for a team
 */
router.get('/surgeries', AuthMiddleware.verifyToken, clinicalHistoryController.getTeamSurgeries);

/**
 * POST /api/clinical-history/surgeries
 * Save team surgeries
 */
router.post('/surgeries', AuthMiddleware.verifyToken, clinicalHistoryController.saveSurgeries);

/**
 * GET /api/clinical-history/screening-data
 * Get screening data for thematic areas with replies
 */
router.get('/screening-data', AuthMiddleware.verifyToken, clinicalHistoryController.getScreeningData);

/**
 * GET /api/clinical-history
 * Get complete consumer clinical history data
 */
router.get('/', AuthMiddleware.verifyToken, clinicalHistoryController.getConsumerData);

/**
 * PUT /api/clinical-history
 * Update consumer form data
 */
router.put('/', AuthMiddleware.verifyToken, validateConsumerUpdate, clinicalHistoryController.updateConsumerForm);

module.exports = router;
