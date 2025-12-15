const express = require('express');
const { query, param } = require('express-validator');
const doctorsController = require('../controllers/doctorsController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/doctors/examinations
 * Get all examinations for filter dropdown
 * Public endpoint (no auth required)
 */
router.get('/examinations',
  doctorsController.getExaminations.bind(doctorsController)
);

/**
 * GET /api/doctors/pathologies
 * Get all pathologies for filter dropdown
 * Public endpoint (no auth required)
 */
router.get('/pathologies',
  doctorsController.getPathologies.bind(doctorsController)
);

/**
 * GET /api/doctors/autocomplete
 * Autocomplete search for doctors
 * Public endpoint (no auth required)
 */
router.get('/autocomplete',
  [
    query('q')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Query troppo lunga'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit deve essere tra 1 e 20')
  ],
  doctorsController.autocomplete.bind(doctorsController)
);

/**
 * GET /api/doctors/:id
 * Get doctor details by ID
 * Protected endpoint - requires authentication
 */
router.get('/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID medico non valido')
  ],
  doctorsController.getById.bind(doctorsController)
);

/**
 * GET /api/doctors
 * Search doctors with filters and pagination
 * Protected endpoint - requires authentication
 */
router.get('/',
  AuthMiddleware.verifyToken,
  [
    query('type')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Tipo non valido'),
    query('examination')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Esame non valido'),
    query('pathology')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Patologia non valida'),
    query('municipalityId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Comune non valido'),
    query('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitudine non valida'),
    query('lon')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitudine non valida'),
    query('radius')
      .optional()
      .isFloat({ min: 0.1, max: 500 })
      .withMessage('Raggio deve essere tra 0.1 e 500 km'),
    query('query')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Query troppo lunga'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Pagina non valida'),
    query('size')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Dimensione pagina deve essere tra 1 e 50')
  ],
  doctorsController.search.bind(doctorsController)
);

module.exports = router;
