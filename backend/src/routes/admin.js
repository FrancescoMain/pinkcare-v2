const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const AuthMiddleware = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(AuthMiddleware.verifyToken);
router.use(AuthMiddleware.requireAdmin);

// Consumer management
router.get('/consumers', adminController.getConsumers);
router.get('/consumers/export', adminController.exportConsumers);
router.put('/consumers/:userId/toggle-access', adminController.toggleAccess);
router.put('/consumers/:userId/toggle-marketing', adminController.toggleMarketing);
router.put('/consumers/:userId/toggle-newsletter', adminController.toggleNewsletter);

// Business management
router.get('/businesses', adminController.getBusinesses);
router.get('/businesses/export', adminController.exportBusinesses);
router.put('/businesses/:userId/toggle-access', adminController.toggleAccess);
router.put('/businesses/:userId/toggle-marketing', adminController.toggleMarketing);
router.put('/businesses/:userId/toggle-newsletter', adminController.toggleNewsletter);
router.put('/businesses/:teamId/toggle-searchable', adminController.toggleSearchable);

// Reference data
router.get('/typologies', adminController.getTypologies);

module.exports = router;
