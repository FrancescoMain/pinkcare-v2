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
    // Step 1: get a presigned upload URL from backend
    const { signedUrl, storagePath } = await ApiService.get(
      `/api/document-shop/upload-url?fileName=${encodeURIComponent(file.name)}`
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
    return ApiService.post('/api/document-shop', {
      storagePath,
      fileName: file.name,
      name_patient: data.name_patient,
      surname_patient: data.surname_patient,
      notes: data.notes || null,
      doctorId: data.doctorId || null
    });
  }

  static async downloadDocument(id, fileName) {
    // Backend redirects to a signed Supabase URL — follow the redirect
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl(`/api/document-shop/${id}/download`), {
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

  static async deleteDocument(id) {
    return ApiService.delete(`/api/document-shop/${id}`);
  }

  static async searchDoctors(query) {
    return ApiService.get(`/api/document-shop/doctors?q=${encodeURIComponent(query)}`);
  }
}

export default DocumentShopApi;
