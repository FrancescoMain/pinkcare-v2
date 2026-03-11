import ApiService from './apiService';

/**
 * Schedule API Service
 * Handles personal agenda/schedule HTTP requests
 */
class ScheduleApi {

  /**
   * Get schedule events in date range
   * @param {string} start - Start date (YYYY-MM-DD)
   * @param {string} end - End date (YYYY-MM-DD)
   * @returns {Promise} - Promise with events array
   */
  static async getEvents(start, end) {
    return ApiService.get('/api/schedule/events', {
      params: { start, end }
    });
  }

  /**
   * Get single event by ID
   * @param {number} id - Event ID
   * @returns {Promise} - Promise with event data
   */
  static async getEvent(id) {
    return ApiService.get(`/api/schedule/events/${id}`);
  }

  /**
   * Get upcoming events
   * @param {number} days - Number of days to look ahead (default 30)
   * @returns {Promise} - Promise with upcoming events
   */
  static async getUpcomingEvents(days = 30) {
    return ApiService.get('/api/schedule/upcoming', {
      params: { days }
    });
  }

  /**
   * Get available colors for events
   * @returns {Promise} - Promise with colors array
   */
  static async getColors() {
    return ApiService.get('/api/schedule/colors');
  }

  /**
   * Create schedule event
   * @param {Object} eventData - Event data
   * @param {string} eventData.heading - Event title
   * @param {string} eventData.message - Event description (optional)
   * @param {string} eventData.eventBeginning - Start date/time (ISO 8601)
   * @param {string} eventData.eventEnding - End date/time (optional)
   * @param {string} eventData.reminder - First reminder date (optional)
   * @param {string} eventData.reminder2 - Second reminder date (optional)
   * @param {string} eventData.reminder3 - Third reminder date (optional)
   * @param {string} eventData.reminder4 - Fourth reminder date (optional)
   * @param {string} eventData.reminder5 - Fifth reminder date (optional)
   * @param {string} eventData.color - Event color CSS class (optional)
   * @returns {Promise} - Promise with created event
   */
  static async createEvent(eventData) {
    return ApiService.post('/api/schedule/events', eventData);
  }

  /**
   * Update schedule event
   * @param {number} id - Event ID
   * @param {Object} eventData - Event data to update
   * @returns {Promise} - Promise with updated event
   */
  static async updateEvent(id, eventData) {
    return ApiService.put(`/api/schedule/events/${id}`, eventData);
  }

  /**
   * Move event (drag & drop)
   * @param {number} id - Event ID
   * @param {string} start - New start date/time (ISO 8601)
   * @param {string} end - New end date/time (ISO 8601)
   * @returns {Promise} - Promise with updated event
   */
  static async moveEvent(id, start, end) {
    return ApiService.patch(`/api/schedule/events/${id}/move`, { start, end });
  }

  /**
   * Resize event
   * @param {number} id - Event ID
   * @param {string} end - New end date/time (ISO 8601)
   * @returns {Promise} - Promise with updated event
   */
  static async resizeEvent(id, end) {
    return ApiService.patch(`/api/schedule/events/${id}/resize`, { end });
  }

  /**
   * Delete schedule event (soft delete)
   * @param {number} id - Event ID
   * @returns {Promise} - Promise with deletion confirmation
   */
  static async deleteEvent(id) {
    return ApiService.delete(`/api/schedule/events/${id}`);
  }
}

export default ScheduleApi;
