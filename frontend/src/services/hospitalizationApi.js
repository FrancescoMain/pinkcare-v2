import ApiService from './apiService';
import { buildApiUrl, getAuthHeaders } from '../config/api';

class HospitalizationApi {

  static async getPatients(params = {}) {
    const query = new URLSearchParams();
    if (params.name) query.set('name', params.name);
    if (params.surname) query.set('surname', params.surname);
    if (params.codFisc) query.set('codFisc', params.codFisc);
    if (params.page !== undefined) query.set('page', params.page);
    const qs = query.toString();
    return ApiService.get(`/api/hospitalization/patients${qs ? '?' + qs : ''}`);
  }

  static async approvePatient(patientId) {
    return ApiService.post(`/api/hospitalization/patients/${patientId}/approve`);
  }

  static async getDocuments(patientId, page = 0) {
    return ApiService.get(`/api/hospitalization/patients/${patientId}/documents?page=${page}`);
  }

  static async uploadDocument(patientId, file, details) {
    const formData = new FormData();
    formData.append('file', file);
    if (details) formData.append('details', details);

    const headers = getAuthHeaders();
    // Remove Content-Type so browser sets multipart boundary
    delete headers['Content-Type'];

    const response = await fetch(buildApiUrl(`/api/hospitalization/patients/${patientId}/documents`), {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Errore nel caricamento');
    }

    return response.json();
  }

  static async downloadDocument(documentId, fileName) {
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl(`/api/hospitalization/documents/${documentId}/download`), {
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
    return ApiService.delete(`/api/hospitalization/documents/${documentId}`);
  }

  static async generateCode(data) {
    return ApiService.post('/api/hospitalization/generate-code', data);
  }
}

export default HospitalizationApi;
