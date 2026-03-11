import { ApiClient, API_CONFIG } from '../config/api';

class ReferenceService {
  static async getMedicalTitles() {
    return ApiClient.get(API_CONFIG.ENDPOINTS.REFERENCE.MEDICAL_TITLES);
  }

  static async searchMunicipalities(query) {
    return ApiClient.get(`${API_CONFIG.ENDPOINTS.REFERENCE.MUNICIPALITIES}?q=${encodeURIComponent(query)}`);
  }
}

/**
 * Autocomplete function for municipalities
 * Used by AutocompleteInput component
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of municipalities
 */
export const autocompleteMunicipalities = async (query) => {
  const response = await ReferenceService.searchMunicipalities(query);
  // ApiClient returns data directly, not wrapped in {data: ...}
  return Array.isArray(response) ? response : [];
};

export default ReferenceService;
