const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const AuthMiddleware = require('../middleware/auth');

/**
 * Dashboard routes
 * All routes require authentication
 */

// GET /api/dashboard - Get dashboard data
router.get('/',
  AuthMiddleware.verifyToken,
  dashboardController.getDashboardData
);

module.exports = router;
