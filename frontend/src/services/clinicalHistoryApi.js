import { ApiClient } from '../config/api';

/**
 * Clinical History API Service
 * Handles all clinical history related API calls
 */

/**
 * Get complete consumer clinical history data
 * @returns {Promise} Consumer data with surgeries and pregnancy stats
 */
export const getConsumerData = async () => {
  const response = await ApiClient.get('/api/clinical-history');
  return response; // ApiClient.request() already returns parsed JSON
};

/**
 * Update consumer form data
 * @param {Object} data - Updated consumer data
 * @returns {Promise} Updated consumer data
 */
export const updateConsumerForm = async (data) => {
  const response = await ApiClient.put('/api/clinical-history', data);
  return response.data;
};

/**
 * Get all surgeries for a team
 * @returns {Promise} List of surgeries
 */
export const getTeamSurgeries = async () => {
  const response = await ApiClient.get('/api/clinical-history/surgeries');
  return response.data;
};

/**
 * Save team surgeries
 * @param {Array} surgeries - Array of surgery objects
 * @returns {Promise} Saved surgeries
 */
export const saveSurgeries = async (surgeries) => {
  const response = await ApiClient.post('/api/clinical-history/surgeries', { surgeries });
  return response.data;
};

/**
 * Get screening data for thematic areas
 * @param {Array} thematicAreaIds - Optional array of thematic area IDs
 * @returns {Promise} Screening data
 */
export const getScreeningData = async (thematicAreaIds = null) => {
  const params = thematicAreaIds ? { thematicAreaIds } : {};
  const response = await ApiClient.get('/api/clinical-history/screening-data', { params });
  return response.data;
};

/**
 * Download clinical history PDF
 * @returns {Promise} PDF blob
 */
export const downloadClinicalHistoryPDF = async () => {
  // For blob responseType, ApiClient returns the blob directly (not wrapped in {data: ...})
  const blob = await ApiClient.get('/api/clinical-history/download-pdf', {
    responseType: 'blob'
  });
  return blob;
};
