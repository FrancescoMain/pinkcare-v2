const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const AuthMiddleware = require('../middleware/auth');

/**
 * Schedule (Agenda) Routes
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
  scheduleController.getEvents
);

// Get upcoming events
router.get('/upcoming',
  AuthMiddleware.verifyToken,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 }).withMessage('days deve essere tra 1 e 365')
  ],
  scheduleController.getUpcomingEvents
);

// Get available colors
router.get('/colors',
  AuthMiddleware.verifyToken,
  scheduleController.getColors
);

// Get single event
router.get('/events/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo')
  ],
  scheduleController.getEvent
);

// Create event
router.post('/events',
  AuthMiddleware.verifyToken,
  [
    body('heading')
      .notEmpty().withMessage('Il titolo è obbligatorio')
      .isLength({ max: 255 }).withMessage('Il titolo non può superare 255 caratteri'),
    body('message')
      .optional({ nullable: true })
      .isLength({ max: 5000 }).withMessage('La descrizione non può superare 5000 caratteri'),
    body('eventBeginning')
      .notEmpty().withMessage('La data di inizio è obbligatoria')
      .isISO8601().withMessage('eventBeginning deve essere una data valida (ISO 8601)'),
    body('eventEnding')
      .optional({ nullable: true })
      .isISO8601().withMessage('eventEnding deve essere una data valida (ISO 8601)'),
    body('reminder')
      .optional({ nullable: true })
      .isISO8601().withMessage('reminder deve essere una data valida (ISO 8601)'),
    body('reminder2')
      .optional({ nullable: true })
      .isISO8601().withMessage('reminder2 deve essere una data valida (ISO 8601)'),
    body('reminder3')
      .optional({ nullable: true })
      .isISO8601().withMessage('reminder3 deve essere una data valida (ISO 8601)'),
    body('reminder4')
      .optional({ nullable: true })
      .isISO8601().withMessage('reminder4 deve essere una data valida (ISO 8601)'),
    body('reminder5')
      .optional({ nullable: true })
      .isISO8601().withMessage('reminder5 deve essere una data valida (ISO 8601)'),
    body('color')
      .optional({ nullable: true })
      .isLength({ max: 50 }).withMessage('Il colore non può superare 50 caratteri')
  ],
  scheduleController.createEvent
);

// Update event
router.put('/events/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo'),
    body('heading')
      .optional()
      .isLength({ max: 255 }).withMessage('Il titolo non può superare 255 caratteri'),
    body('message')
      .optional({ nullable: true })
      .isLength({ max: 5000 }).withMessage('La descrizione non può superare 5000 caratteri'),
    body('eventBeginning')
      .optional()
      .isISO8601().withMessage('eventBeginning deve essere una data valida (ISO 8601)'),
    body('eventEnding')
      .optional({ nullable: true })
      .isISO8601().withMessage('eventEnding deve essere una data valida (ISO 8601)'),
    body('reminder')
      .optional({ nullable: true })
      .isISO8601().withMessage('reminder deve essere una data valida (ISO 8601)'),
    body('color')
      .optional({ nullable: true })
      .isLength({ max: 50 }).withMessage('Il colore non può superare 50 caratteri')
  ],
  scheduleController.updateEvent
);

// Move event (drag & drop)
router.patch('/events/:id/move',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo'),
    body('start')
      .notEmpty().withMessage('La nuova data di inizio è obbligatoria')
      .isISO8601().withMessage('start deve essere una data valida (ISO 8601)'),
    body('end')
      .notEmpty().withMessage('La nuova data di fine è obbligatoria')
      .isISO8601().withMessage('end deve essere una data valida (ISO 8601)')
  ],
  scheduleController.moveEvent
);

// Resize event
router.patch('/events/:id/resize',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo'),
    body('end')
      .notEmpty().withMessage('La nuova data di fine è obbligatoria')
      .isISO8601().withMessage('end deve essere una data valida (ISO 8601)')
  ],
  scheduleController.resizeEvent
);

// Delete event
router.delete('/events/:id',
  AuthMiddleware.verifyToken,
  [
    param('id')
      .isInt({ min: 1 }).withMessage('ID evento deve essere un intero positivo')
  ],
  scheduleController.deleteEvent
);

module.exports = router;
