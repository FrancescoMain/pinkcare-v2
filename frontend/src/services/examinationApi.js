import ApiService from './apiService';
import { buildApiUrl, getAuthHeaders } from '../config/api';

/**
 * Examination API Service
 * Handles recommended examination HTTP requests
 */
class ExaminationApi {

  /**
   * Get age-based examinations
   * @returns {Promise} - Promise with examinations array
   */
  static async getAgeExaminations() {
    return ApiService.get('/api/examinations/age-based');
  }

  /**
   * Get routine examinations
   * @returns {Promise} - Promise with examinations array
   */
  static async getRoutineExaminations() {
    return ApiService.get('/api/examinations/routine');
  }

  /**
   * Get screening-based examinations
   * @returns {Promise} - Promise with screening groups array
   */
  static async getScreeningExaminations() {
    return ApiService.get('/api/examinations/screening');
  }

  /**
   * Mark/update exam date
   * @param {number|string} id - Exam ID or 'new'
   * @param {string} controlDate - ISO 8601 date
   * @param {number} examinationId - ExaminationPathology ID
   * @param {number|null} protocolRuleId - Protocol rule ID
   * @returns {Promise} - Promise with updated exam
   */
  static async markExamDate(id, controlDate, examinationId, protocolRuleId) {
    return ApiService.put(`/api/examinations/${id || 'new'}/date`, {
      controlDate,
      examinationId,
      protocolRuleId
    });
  }

  /**
   * Confirm an examination
   * @param {number} id - Exam ID
   * @param {string|null} note - Optional note
   * @returns {Promise} - Promise with confirmed exam
   */
  static async confirmExamination(id, note) {
    return ApiService.put(`/api/examinations/${id}/confirm`, { note });
  }

  /**
   * Remove date from an examination
   * @param {number} id - Exam ID
   * @returns {Promise} - Promise with updated exam
   */
  static async removeDate(id) {
    return ApiService.put(`/api/examinations/${id}/remove-date`);
  }

  /**
   * Toggle archive status of a screening
   * @param {number} screeningId - Screening ID
   * @returns {Promise} - Promise with new archived state
   */
  static async toggleArchiveScreening(screeningId) {
    return ApiService.put(`/api/examinations/screening/${screeningId}/archive`);
  }

  /**
   * Get suggested (unconfirmed) examinations for history page
   * @returns {Promise} - Promise with examinations array
   */
  static async getSuggestedExaminations() {
    return ApiService.get('/api/examinations/suggested');
  }

  /**
   * Get examination history (confirmed exams)
   * @returns {Promise} - Promise with examinations array
   */
  static async getExaminationHistory() {
    return ApiService.get('/api/examinations/history');
  }

  /**
   * Get attachments for an examination
   * @param {number} examId - Examination ID
   * @returns {Promise} - Promise with attachments array
   */
  static async getAttachments(examId) {
    return ApiService.get(`/api/examinations/${examId}/attachments`);
  }

  /**
   * Upload attachment for an examination
   * @param {number} examId - Examination ID
   * @param {File} file - File to upload
   * @returns {Promise} - Promise with uploaded attachment
   */
  static async uploadAttachment(examId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = getAuthHeaders();
    // Remove Content-Type so browser sets boundary for multipart
    delete headers['Content-Type'];
    const response = await fetch(buildApiUrl(`/api/examinations/${examId}/attachments`), {
      method: 'POST',
      headers,
      body: formData
    });
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    return response.json();
  }

  /**
   * Download an attachment
   * @param {number} attachmentId - Attachment ID
   * @param {string} fileName - Original file name for download
   */
  static async downloadAttachment(attachmentId, fileName) {
    const headers = getAuthHeaders();
    const response = await fetch(buildApiUrl(`/api/examinations/attachments/${attachmentId}/download`), {
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

  /**
   * Delete an attachment
   * @param {number} attachmentId - Attachment ID
   * @returns {Promise}
   */
  static async deleteAttachment(attachmentId) {
    return ApiService.delete(`/api/examinations/attachments/${attachmentId}`);
  }
}

export default ExaminationApi;
