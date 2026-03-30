import { ApiClient } from '../config/api';

class AdminApi {

  static async getConsumers(filters = {}, page = 1, size = 15) {
    return ApiClient.get('/api/admin/consumers', {
      params: { ...filters, page, size }
    });
  }

  static async getBusinesses(filters = {}, page = 1, size = 15) {
    return ApiClient.get('/api/admin/businesses', {
      params: { ...filters, page, size }
    });
  }

  static async toggleAccess(type, userId) {
    const prefix = type === 'consumer' ? 'consumers' : 'businesses';
    return ApiClient.put(`/api/admin/${prefix}/${userId}/toggle-access`);
  }

  static async toggleMarketing(type, userId) {
    const prefix = type === 'consumer' ? 'consumers' : 'businesses';
    return ApiClient.put(`/api/admin/${prefix}/${userId}/toggle-marketing`);
  }

  static async toggleNewsletter(type, userId) {
    const prefix = type === 'consumer' ? 'consumers' : 'businesses';
    return ApiClient.put(`/api/admin/${prefix}/${userId}/toggle-newsletter`);
  }

  static async toggleSearchable(teamId) {
    return ApiClient.put(`/api/admin/businesses/${teamId}/toggle-searchable`);
  }

  static async exportConsumers(filters = {}) {
    return ApiClient.get('/api/admin/consumers/export', {
      params: filters,
      responseType: 'blob'
    });
  }

  static async exportBusinesses(filters = {}) {
    return ApiClient.get('/api/admin/businesses/export', {
      params: filters,
      responseType: 'blob'
    });
  }

  static async getTypologies() {
    return ApiClient.get('/api/admin/typologies');
  }
}

export default AdminApi;
