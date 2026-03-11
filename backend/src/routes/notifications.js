const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const AuthMiddleware = require('../middleware/auth');

/**
 * Notification Routes
 * All routes require authentication
 */

// Get unread notifications (header bell dropdown)
router.get('/unread',
  AuthMiddleware.verifyToken,
  notificationController.getUnread.bind(notificationController)
);

// Get all notifications (paginated, profile tab=2)
router.get('/',
  AuthMiddleware.verifyToken,
  notificationController.getAll.bind(notificationController)
);

// Mark all notifications as read (must be before /:id routes)
router.put('/read-all',
  AuthMiddleware.verifyToken,
  notificationController.markAllAsRead.bind(notificationController)
);

// Get notification link and mark as read
router.get('/:id/link',
  AuthMiddleware.verifyToken,
  [
    param('id').isInt().withMessage('ID notifica deve essere un intero')
  ],
  notificationController.getLink.bind(notificationController)
);

// Mark a single notification as read
router.put('/:id/read',
  AuthMiddleware.verifyToken,
  [
    param('id').isInt().withMessage('ID notifica deve essere un intero')
  ],
  notificationController.markAsRead.bind(notificationController)
);

// Soft-delete a notification
router.delete('/:id',
  AuthMiddleware.verifyToken,
  [
    param('id').isInt().withMessage('ID notifica deve essere un intero')
  ],
  notificationController.deleteNotification.bind(notificationController)
);

module.exports = router;
