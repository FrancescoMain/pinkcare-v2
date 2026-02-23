const express = require('express');
const router = express.Router();
const pregnancyController = require('../controllers/pregnancyController');
const AuthMiddleware = require('../middleware/auth');

// All routes require authentication
router.get('/status',
  AuthMiddleware.verifyToken,
  pregnancyController.getStatus
);

router.post('/calculate',
  AuthMiddleware.verifyToken,
  pregnancyController.calculate
);

router.post('/save',
  AuthMiddleware.verifyToken,
  pregnancyController.save
);

router.post('/terminate',
  AuthMiddleware.verifyToken,
  pregnancyController.terminate
);

module.exports = router;
