const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const AuthMiddleware = require('../middleware/auth');

/**
 * Calendar Routes
 * All routes require authentication as they're user-specific
 */

// Get events in date range
router.get('/events',
  AuthMiddleware.verifyToken,
  [
    query('start')
      .notEmpty().withMessage('Parametro start obbligatorio')
      .isISO8601().withMessage('Formato start deve essere YYYY-MM-DD'),
    query('end')
      .notEmpty().withMessage('Parametro end obbligatorio')
      .isISO8601().withMessage('Formato end deve essere YYYY-MM-DD')
  ],
  calendarController.getEvents
);

// Create calendar event
router.post('/events',
  AuthMiddleware.verifyToken,
  [
    body('typeId')
      .notEmpty().withMessage('typeId obbligatorio')
      .isInt({ min: 1 }).withMessage('typeId deve essere un intero positivo'),
    body('beginning')
      .notEmpty().withMessage('beginning obbligatorio')
      .isISO8601().withMessage('beginning deve essere una data valida (ISO 8601)'),
    body('ending')
      .optional({ nullable: true })
      .isISO8601().withMessage('ending deve essere una data valida (ISO 8601)'),
    body('value')
      .optional({ nullable: true })
      .isFloat().withMessage('value deve essere un numero'),
    body('details')
      .optional()
      .isArray().withMessage('details deve essere un array'),
    body('details.*.detailTypeId')
      .if(body('details').exists())
      .isInt({ min: 1 }).withMessage('detailTypeId deve essere un intero positivo'),
    body('details.*.value')
      .if(body('details').exists())
      .optional({ nullable: true })
      .isInt({ min: 0, max: 3 }).withMessage('value deve essere tra 0 e 3'),
    body('details.*.selected')
      .if(body('details').exists())
      .isBoolean().withMessage('selected deve essere un booleano')
  ],
  calendarController.createEvent
);

// Update calendar event
router.put('/events/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo'),
    body('beginning')
      .optional()
      .isISO8601().withMessage('beginning deve essere una data valida (ISO 8601)'),
    body('ending')
      .optional({ nullable: true })
      .isISO8601().withMessage('ending deve essere una data valida (ISO 8601)'),
    body('value')
      .optional({ nullable: true })
      .isFloat().withMessage('value deve essere un numero'),
    body('details')
      .optional()
      .isArray().withMessage('details deve essere un array')
  ],
  calendarController.updateEvent
);

// Delete calendar event
router.delete('/events/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo')
  ],
  calendarController.deleteEvent
);

// Get event detail types (symptoms, drugs, moods)
router.get('/event-detail-types',
  AuthMiddleware.verifyToken,
  [
    query('eventType')
      .notEmpty().withMessage('Parametro eventType obbligatorio')
      .isInt().withMessage('eventType deve essere un intero')
      .isIn([23, 24, 25]).withMessage('eventType deve essere 23 (symptoms), 24 (drugs) o 25 (moods)')
  ],
  calendarController.getEventDetailTypes
);

// Get last menses date
router.get('/last-menses',
  AuthMiddleware.verifyToken,
  calendarController.getLastMenses
);

// Start a new menstrual period
router.post('/start-period',
  AuthMiddleware.verifyToken,
  [
    body('date')
      .notEmpty().withMessage('date obbligatoria')
      .isISO8601().withMessage('date deve essere una data valida (ISO 8601)')
  ],
  calendarController.startPeriod
);

// End current menstrual period
router.post('/end-period',
  AuthMiddleware.verifyToken,
  [
    body('date')
      .notEmpty().withMessage('date obbligatoria')
      .isISO8601().withMessage('date deve essere una data valida (ISO 8601)')
  ],
  calendarController.endPeriod
);

module.exports = router;
