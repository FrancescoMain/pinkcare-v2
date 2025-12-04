import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

/**
 * Get all thematic areas for screening choice
 */
export const getThematicAreas = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/questionnaire/thematic-areas`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  return response.data;
};

/**
 * Initialize screening questions
 * @param {number} screeningType - -1 for age-based, >0 for thematic area id
 */
export const initializeScreening = async (screeningType) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/questionnaire/initialize`,
    { screeningType },
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }
  );
  return response.data;
};

/**
 * Elaborate screening for a single thematic area
 * @param {number} thematicAreaId
 * @param {Array} questions
 * @param {number} screeningType
 */
export const elaborateScreening = async (thematicAreaId, questions, screeningType) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/questionnaire/elaborate`,
    {
      thematicAreaId,
      questions,
      screeningType
    },
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }
  );
  return response.data;
};

/**
 * Elaborate all screening thematic areas
 * @param {Array} thematicAreas
 */
export const elaborateAllScreening = async (thematicAreas) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/questionnaire/elaborate-all`,
    { thematicAreas },
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }
  );
  return response.data;
};

/**
 * Get user's previous screenings
 */
export const getScreenings = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/questionnaire/screenings`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  return response.data;
};
