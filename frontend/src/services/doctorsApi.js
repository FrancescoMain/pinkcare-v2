import { ApiClient } from '../config/api';

/**
 * Doctors API Service
 * Handles all API calls related to doctors/clinics listing
 */
class DoctorsApi {

  /**
   * Search doctors with filters and pagination
   * @param {Object} filters - Search filters
   * @param {number} filters.type - Type ID (3=DOCTOR, 4=CLINIC, null=both)
   * @param {number} filters.examination - Examination ID filter
   * @param {number} filters.pathology - Pathology ID filter
   * @param {number} filters.municipalityId - Municipality ID for geo-search
   * @param {number} filters.lat - Latitude for geo-search
   * @param {number} filters.lon - Longitude for geo-search
   * @param {number} filters.radius - Search radius in km
   * @param {string} filters.query - Text search on name
   * @param {number} page - Page number (1-based)
   * @param {number} size - Page size
   * @returns {Promise<Object>} Paginated results
   */
  static async search(filters = {}, page = 1, size = 15) {
    const params = {
      page,
      size,
      ...filters
    };

    // Remove null/undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const response = await ApiClient.get('/api/doctors', { params });
    return response.data;
  }

  /**
   * Get doctor details by ID
   * @param {number} id - Doctor/Team ID
   * @returns {Promise<Object>} Doctor details
   */
  static async getById(id) {
    const response = await ApiClient.get(`/api/doctors/${id}`);
    return response.data;
  }

  /**
   * Autocomplete search for doctors by name
   * @param {string} query - Search query
   * @param {number} limit - Max results (default 10)
   * @returns {Promise<Array>} Matching doctors
   */
  static async autocomplete(query, limit = 10) {
    const response = await ApiClient.get('/api/doctors/autocomplete', {
      params: { q: query, limit }
    });
    return response.data;
  }

  /**
   * Get all examinations for filter dropdown
   * @returns {Promise<Array>} List of examinations
   */
  static async getExaminations() {
    const response = await ApiClient.get('/api/doctors/examinations');
    return response.data;
  }

  /**
   * Get all pathologies for filter dropdown
   * @returns {Promise<Array>} List of pathologies
   */
  static async getPathologies() {
    const response = await ApiClient.get('/api/doctors/pathologies');
    return response.data;
  }
}

export default DoctorsApi;
