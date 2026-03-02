import ApiService from './apiService';

/**
 * Business API Service
 * Handles API calls for the Scheda Personale (business profile form)
 */
class BusinessApi {

  static async getProfile() {
    return ApiService.get('/api/business/profile');
  }

  static async updateProfile(data) {
    return ApiService.put('/api/business/profile', data);
  }

  static async updateAddress(data) {
    return ApiService.put('/api/business/address', data);
  }

  static async updateExaminations(ids) {
    return ApiService.put('/api/business/examinations', { ids });
  }

  static async updatePathologies(ids) {
    return ApiService.put('/api/business/pathologies', { ids });
  }
}

export default BusinessApi;
