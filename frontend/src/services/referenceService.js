import { ApiClient, API_CONFIG } from '../config/api';

class ReferenceService {
  static async getMedicalTitles() {
    return ApiClient.get(API_CONFIG.ENDPOINTS.REFERENCE.MEDICAL_TITLES);
  }

  static async searchMunicipalities(query) {
    return ApiClient.get(`${API_CONFIG.ENDPOINTS.REFERENCE.MUNICIPALITIES}?q=${encodeURIComponent(query)}`);
  }
}

export default ReferenceService;
