import ApiService from './apiService';

/**
 * Calendar API Service
 * Handles menstrual calendar HTTP requests
 */
class CalendarApi {

  /**
   * Get calendar events in date range
   * @param {string} start - Start date (YYYY-MM-DD)
   * @param {string} end - End date (YYYY-MM-DD)
   * @returns {Promise} - Promise with events and user profile
   */
  static async getEvents(start, end) {
    return ApiService.get(`/api/calendar/events`, {
      params: { start, end }
    });
  }

  /**
   * Create calendar event
   * @param {Object} eventData - Event data
   * @param {number} eventData.typeId - Event type ID
   * @param {string} eventData.beginning - Start date/time
   * @param {string} eventData.ending - End date/time (optional)
   * @param {number} eventData.value - Numeric value (optional)
   * @param {Array} eventData.details - Event details (optional)
   * @returns {Promise} - Promise with created event
   */
  static async createEvent(eventData) {
    return ApiService.post('/api/calendar/events', eventData);
  }

  /**
   * Update calendar event
   * @param {number} id - Event ID
   * @param {Object} eventData - Event data to update
   * @returns {Promise} - Promise with updated event
   */
  static async updateEvent(id, eventData) {
    return ApiService.put(`/api/calendar/events/${id}`, eventData);
  }

  /**
   * Delete calendar event
   * @param {number} id - Event ID
   * @returns {Promise} - Promise with deletion confirmation
   */
  static async deleteEvent(id) {
    return ApiService.delete(`/api/calendar/events/${id}`);
  }

  /**
   * Get event detail types (symptoms, drugs, moods)
   * @param {number} eventType - Event type ID (23=symptoms, 24=drugs, 25=moods)
   * @returns {Promise} - Promise with detail types
   */
  static async getEventDetailTypes(eventType) {
    return ApiService.get('/api/calendar/event-detail-types', {
      params: { eventType }
    });
  }

  /**
   * Get last menses date and open period info
   * @returns {Promise} - Promise with lastMensesDate, hasOpenPeriod, openPeriodId
   */
  static async getLastMenses() {
    return ApiService.get('/api/calendar/last-menses');
  }

  /**
   * Start a new menstrual period
   * @param {string} date - Start date (YYYY-MM-DD)
   * @returns {Promise} - Promise with created event
   */
  static async startPeriod(date) {
    return ApiService.post('/api/calendar/start-period', { date });
  }

  /**
   * End current menstrual period
   * @param {string} date - End date (YYYY-MM-DD)
   * @returns {Promise} - Promise with updated event
   */
  static async endPeriod(date) {
    return ApiService.post('/api/calendar/end-period', { date });
  }
}

export default CalendarApi;
