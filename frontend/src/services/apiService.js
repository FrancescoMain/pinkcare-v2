import { ApiClient } from '../config/api';

/**
 * Generic API Service
 * Wrapper for ApiClient with common HTTP methods
 */
export class ApiService {

  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  static async get(url, config = {}) {
    return ApiClient.get(url, config);
  }

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  static async post(url, data, config = {}) {
    return ApiClient.post(url, data, config);
  }

  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  static async put(url, data, config = {}) {
    return ApiClient.put(url, data, config);
  }

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  static async delete(url, config = {}) {
    return ApiClient.delete(url, config);
  }

  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} data - Request body
   * @param {Object} config - Additional axios config
   * @returns {Promise} - Promise with response data
   */
  static async patch(url, data, config = {}) {
    return ApiClient.patch(url, data, config);
  }
}

export default ApiService;
