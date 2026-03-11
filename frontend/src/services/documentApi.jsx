import ApiService from './apiService';
import { buildApiUrl, getAuthHeaders } from '../config/api';

class DocumentApi {

  static async getClinics() {
    return ApiService.get('/api/documents/clinics');
  }

  static async getBusinessTeams(typeId) {
    return ApiService.get(`/api/documents/teams?typeId=${typeId}`);
  }

  static async getDocuments(params = {}) {
    const query = new URLSearchParams();
    if (params.typology) query.set('typology', params.typology);
    if (params.clinicId) query.set('clinicId', params.clinicId);
    if (params.doctorId) query.set('doctorId', params.doctorId);
    if (params.page !== undefined) query.set('page', params.page);
    const qs = query.toString();
    return ApiService.get(`/api/documents${qs ? '?' + qs : ''}`);
  }

  static async downloadDocument(documentId, fileName) {
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl(`/api/documents/${documentId}/download`), {
      method: 'GET',
      headers
    });
    if (!response.ok) {
      throw new Error('Download failed');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  static async deleteDocument(documentId) {
    return ApiService.delete(`/api/documents/${documentId}`);
  }

  static async attachToExam(documentId, examId) {
    return ApiService.post(`/api/documents/${documentId}/attach/${examId}`);
  }
}

export default DocumentApi;
