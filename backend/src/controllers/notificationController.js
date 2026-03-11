const notificationService = require('../services/notificationService');

/**
 * Notification Controller
 * Handles notification API endpoints
 */
class NotificationController {

  /**
   * Get unread notifications (for header bell dropdown)
   * GET /api/notifications/unread
   */
  async getUnread(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.getUnreadNotifications(userId);
      return res.json({ notifications });
    } catch (error) {
      console.error('[NotificationController] getUnread error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento delle notifiche'
      });
    }
  }

  /**
   * Get all notifications (paginated, for profile tab=2)
   * GET /api/notifications?page=0&limit=15
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 15;

      const result = await notificationService.getAllNotifications(userId, page, limit);
      return res.json(result);
    } catch (error) {
      console.error('[NotificationController] getAll error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento delle notifiche'
      });
    }
  }

  /**
   * Mark a single notification as read
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await notificationService.markAsRead(parseInt(id), userId);
      return res.json({ message: 'Notifica segnata come letta', notification: result });
    } catch (error) {
      console.error('[NotificationController] markAsRead error:', error);

      if (error.message === 'Notifica non trovata') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel segnare la notifica come letta'
      });
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const count = await notificationService.markAllAsRead(userId);
      return res.json({ message: 'Tutte le notifiche segnate come lette', count });
    } catch (error) {
      console.error('[NotificationController] markAllAsRead error:', error);
      return res.status(500).json({
        error: 'Errore nel segnare tutte le notifiche come lette'
      });
    }
  }

  /**
   * Get notification link and mark as read
   * GET /api/notifications/:id/link
   */
  async getLink(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const link = await notificationService.getNotificationLink(parseInt(id), userId);
      return res.json({ link });
    } catch (error) {
      console.error('[NotificationController] getLink error:', error);

      if (error.message === 'Notifica non trovata') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel recupero del link della notifica'
      });
    }
  }

  /**
   * Soft-delete a notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await notificationService.deleteNotification(parseInt(id), userId);
      return res.json({ message: 'Notifica eliminata' });
    } catch (error) {
      console.error('[NotificationController] deleteNotification error:', error);

      if (error.message === 'Notifica non trovata') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'eliminazione della notifica'
      });
    }
  }
}

module.exports = new NotificationController();
