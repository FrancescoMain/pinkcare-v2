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

  // Collaborators
  static async getCollaborators(page = 1, size = 15) {
    return ApiClient.get('/api/admin/collaborators', {
      params: { page, size }
    });
  }

  static async createCollaborator(data) {
    return ApiClient.post('/api/admin/collaborators', data);
  }

  static async updateCollaborator(userId, data) {
    return ApiClient.put(`/api/admin/collaborators/${userId}`, data);
  }

  static async deleteCollaborator(userId) {
    return ApiClient.delete(`/api/admin/collaborators/${userId}`);
  }

  // Collaborator roles
  static async getCollaboratorRoles(userId) {
    return ApiClient.get(`/api/admin/collaborators/${userId}/roles`);
  }

  static async getAssignableRoles(userId) {
    return ApiClient.get(`/api/admin/collaborators/${userId}/assignable-roles`);
  }

  static async addRoleToUser(userId, roleId) {
    return ApiClient.post(`/api/admin/collaborators/${userId}/roles`, { roleId });
  }

  static async updateUserRolePermissions(userId, roleId, permissions) {
    return ApiClient.put(`/api/admin/collaborators/${userId}/roles/${roleId}`, permissions);
  }

  static async removeRoleFromUser(userId, roleId) {
    return ApiClient.delete(`/api/admin/collaborators/${userId}/roles/${roleId}`);
  }

  // Blog categories
  static async getBlogCategories() {
    return ApiClient.get('/api/admin/blog-categories');
  }

  static async createBlogCategory(data) {
    return ApiClient.post('/api/admin/blog-categories', data);
  }

  static async updateBlogCategory(id, data) {
    return ApiClient.put(`/api/admin/blog-categories/${id}`, data);
  }

  static async deleteBlogCategory(id) {
    return ApiClient.delete(`/api/admin/blog-categories/${id}`);
  }

  // Examinations
  static async getExaminations(page = 1, size = 15) {
    return ApiClient.get('/api/admin/examinations', {
      params: { page, size }
    });
  }

  static async createExamination(data) {
    return ApiClient.post('/api/admin/examinations', data);
  }

  static async updateExamination(id, data) {
    return ApiClient.put(`/api/admin/examinations/${id}`, data);
  }

  static async deleteExamination(id) {
    return ApiClient.delete(`/api/admin/examinations/${id}`);
  }

  // Pathologies
  static async getPathologies(page = 1, size = 15) {
    return ApiClient.get('/api/admin/pathologies', {
      params: { page, size }
    });
  }

  static async createPathology(data) {
    return ApiClient.post('/api/admin/pathologies', data);
  }

  static async updatePathology(id, data) {
    return ApiClient.put(`/api/admin/pathologies/${id}`, data);
  }

  static async deletePathology(id) {
    return ApiClient.delete(`/api/admin/pathologies/${id}`);
  }
}

export default AdminApi;
