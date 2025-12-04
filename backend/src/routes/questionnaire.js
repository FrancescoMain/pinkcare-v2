const express = require('express');
const questionnaireController = require('../controllers/questionnaireController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Get thematic areas for screening choice
router.get('/thematic-areas', AuthMiddleware.verifyToken, questionnaireController.getThematicAreas);

// Initialize screening questions (by age or thematic area)
router.post('/initialize', AuthMiddleware.verifyToken, questionnaireController.initializeScreening);

// Save screening answers and get suggested examinations
router.post('/elaborate', AuthMiddleware.verifyToken, questionnaireController.elaborateScreening);

// Save all screening answers
router.post('/elaborate-all', AuthMiddleware.verifyToken, questionnaireController.elaborateAllScreening);

// Get previous screening results
router.get('/screenings', AuthMiddleware.verifyToken, questionnaireController.getScreenings);

module.exports = router;
