import ApiService from './apiService';

/**
 * Notification API Service
 * Handles notification-related API calls
 */
class NotificationApi {

  /**
   * Get unread notifications (for header bell dropdown)
   */
  static async getUnread() {
    return ApiService.get('/api/notifications/unread');
  }

  /**
   * Get all notifications (paginated)
   * @param {number} page - 0-based page number
   * @param {number} limit - items per page
   */
  static async getAll(page = 0, limit = 15) {
    return ApiService.get(`/api/notifications?page=${page}&limit=${limit}`);
  }

  /**
   * Mark a single notification as read
   * @param {number} id - notification ID
   */
  static async markAsRead(id) {
    return ApiService.put(`/api/notifications/${id}/read`);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead() {
    return ApiService.put('/api/notifications/read-all');
  }

  /**
   * Get notification link and mark as read
   * @param {number} id - notification ID
   */
  static async getLink(id) {
    return ApiService.get(`/api/notifications/${id}/link`);
  }

  /**
   * Delete a notification (soft delete)
   * @param {number} id - notification ID
   */
  static async deleteNotification(id) {
    return ApiService.delete(`/api/notifications/${id}`);
  }
}

export default NotificationApi;
