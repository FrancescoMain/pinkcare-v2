import ApiService from './apiService';
import { buildApiUrl, getAuthHeaders } from '../config/api';

class DocumentShopApi {

  static async getDocuments(params = {}) {
    const query = new URLSearchParams();
    if (params.doctorId) query.set('doctorId', params.doctorId);
    if (params.page !== undefined) query.set('page', params.page);
    if (params.pageSize) query.set('pageSize', params.pageSize);
    const qs = query.toString();
    return ApiService.get(`/api/document-shop${qs ? '?' + qs : ''}`);
  }

  static async uploadDocument(file, data) {
    const formData = new FormData();
    formData.append('file', file);
    if (data.name_patient) formData.append('name_patient', data.name_patient);
    if (data.surname_patient) formData.append('surname_patient', data.surname_patient);
    if (data.notes) formData.append('notes', data.notes);
    if (data.doctorId) formData.append('doctorId', data.doctorId);

    const headers = getAuthHeaders();
    // Remove Content-Type so browser sets multipart boundary
    delete headers['Content-Type'];

    const response = await fetch(buildApiUrl('/api/document-shop'), {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData.error || 'Errore nel caricamento');
    }

    return response.json();
  }

  static async downloadDocument(id, fileName) {
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl(`/api/document-shop/${id}/download`), {
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

  static async deleteDocument(id) {
    return ApiService.delete(`/api/document-shop/${id}`);
  }

  static async searchDoctors(query) {
    return ApiService.get(`/api/document-shop/doctors?q=${encodeURIComponent(query)}`);
  }
}

export default DocumentShopApi;
