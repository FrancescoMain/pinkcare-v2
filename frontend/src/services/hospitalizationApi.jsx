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
    // Step 1: get a presigned upload URL from backend
    const { signedUrl, storagePath } = await ApiService.get(
      `/api/hospitalization/patients/${patientId}/upload-url?fileName=${encodeURIComponent(file.name)}`
    );

    // Step 2: upload directly to Supabase (bypasses Vercel — no size limit)
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'application/pdf' }
    });
    if (!uploadRes.ok) {
      throw new Error('Errore nel caricamento del file su storage');
    }

    // Step 3: save metadata to backend
    return ApiService.post(`/api/hospitalization/patients/${patientId}/documents`, {
      storagePath,
      fileName: file.name,
      details: details || null
    });
  }

  static async downloadDocument(documentId, fileName) {
    // Backend redirects to a signed Supabase URL — follow the redirect
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl(`/api/hospitalization/documents/${documentId}/download`), {
      method: 'GET',
      headers,
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error('Download failed');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'download.pdf';
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

  static async generateCodePdf(data) {
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl('/api/hospitalization/generate-code-pdf'), {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore nella generazione del PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code_authentication.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default HospitalizationApi;
