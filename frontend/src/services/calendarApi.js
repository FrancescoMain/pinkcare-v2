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
    const response = await ApiService.get(`/api/calendar/events`, {
      params: { start, end }
    });
    return response.data;
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
    const response = await ApiService.post('/api/calendar/events', eventData);
    return response.data;
  }

  /**
   * Update calendar event
   * @param {number} id - Event ID
   * @param {Object} eventData - Event data to update
   * @returns {Promise} - Promise with updated event
   */
  static async updateEvent(id, eventData) {
    const response = await ApiService.put(`/api/calendar/events/${id}`, eventData);
    return response.data;
  }

  /**
   * Delete calendar event
   * @param {number} id - Event ID
   * @returns {Promise} - Promise with deletion confirmation
   */
  static async deleteEvent(id) {
    const response = await ApiService.delete(`/api/calendar/events/${id}`);
    return response.data;
  }

  /**
   * Get event detail types (symptoms, drugs, moods)
   * @param {number} eventType - Event type ID (23=symptoms, 24=drugs, 25=moods)
   * @returns {Promise} - Promise with detail types
   */
  static async getEventDetailTypes(eventType) {
    const response = await ApiService.get('/api/calendar/event-detail-types', {
      params: { eventType }
    });
    return response.data;
  }
}

export default CalendarApi;
