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

  // Admin endpoints
  static async getProfileByTeamId(teamId) {
    return ApiService.get(`/api/admin/businesses/${teamId}/profile`);
  }

  static async approveField(teamId, field) {
    return ApiService.put(`/api/admin/businesses/${teamId}/approve-field`, { field });
  }

  static async rejectField(teamId, field) {
    return ApiService.put(`/api/admin/businesses/${teamId}/reject-field`, { field });
  }

  static async validateExamPathology(teamId, tepId) {
    return ApiService.put(`/api/admin/businesses/${teamId}/validate-exam-pathology/${tepId}`);
  }

  static async rejectExamPathology(teamId, tepId) {
    return ApiService.put(`/api/admin/businesses/${teamId}/reject-exam-pathology/${tepId}`);
  }
}

export default BusinessApi;
