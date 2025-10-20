/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Determina l'ambiente
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base URLs per diversi ambienti
const API_BASE_URLS = {
  development: 'http://localhost:3002',
  production: process.env.REACT_APP_API_URL || 'https://api.pinkcare.it', // Da configurare in production
  staging: process.env.REACT_APP_API_URL || 'https://staging-api.pinkcare.it'
};

// Ottieni base URL basato sull'ambiente
const getApiBaseUrl = () => {
  if (isDevelopment) return API_BASE_URLS.development;
  if (process.env.REACT_APP_STAGE === 'staging') return API_BASE_URLS.staging;
  return API_BASE_URLS.production;
};

// Export diretto dell'API_URL per uso semplice
export const API_URL = getApiBaseUrl();

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      REGISTER_CONSUMER: '/api/auth/register-consumer',
      REGISTER_BUSINESS: '/api/auth/register-business',
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VERIFY_TOKEN: '/api/auth/verify'
    },
    // User endpoints
    USERS: {
      PROFILE: '/api/users/profile',
      UPDATE_PROFILE: '/api/users/profile'
    },
    REFERENCE: {
      MEDICAL_TITLES: '/api/reference/medical-titles',
      MUNICIPALITIES: '/api/reference/municipalities'
    }
  },
  // Timeout configurazione
  TIMEOUT: 10000, // 10 secondi
  // Headers di default
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Costruisce URL completa per un endpoint
 * @param {string} endpoint - L'endpoint relativo
 * @returns {string} - URL completa
 */
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Ottiene headers con token di autenticazione se disponibile
 * @param {Object} additionalHeaders - Headers aggiuntivi
 * @returns {Object} - Headers completi
 */
export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = { ...API_CONFIG.DEFAULT_HEADERS, ...additionalHeaders };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Utility per le chiamate API con gestione errori centralizzata
 */
export class ApiClient {
  
  /**
   * Effettua una chiamata GET
   * @param {string} endpoint - L'endpoint da chiamare
   * @param {Object} options - Opzioni aggiuntive
   * @returns {Promise} - Promise con la risposta
   */
  static async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  }
  
  /**
   * Effettua una chiamata POST
   * @param {string} endpoint - L'endpoint da chiamare
   * @param {Object} data - Dati da inviare
   * @param {Object} options - Opzioni aggiuntive
   * @returns {Promise} - Promise con la risposta
   */
  static async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options
    });
  }
  
  /**
   * Effettua una chiamata PUT
   * @param {string} endpoint - L'endpoint da chiamare
   * @param {Object} data - Dati da inviare
   * @param {Object} options - Opzioni aggiuntive
   * @returns {Promise} - Promise con la risposta
   */
  static async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      ...options
    });
  }
  
  /**
   * Effettua una chiamata DELETE
   * @param {string} endpoint - L'endpoint da chiamare
   * @param {Object} options - Opzioni aggiuntive
   * @returns {Promise} - Promise con la risposta
   */
  static async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }
  
  /**
   * Metodo base per le chiamate API
   * @param {string} endpoint - L'endpoint da chiamare
   * @param {Object} options - Opzioni della richiesta
   * @returns {Promise} - Promise con la risposta
   */
  static async request(endpoint, options = {}) {
    let url = buildApiUrl(endpoint);

    // Add query parameters if provided
    if (options.params) {
      const queryString = new URLSearchParams(
        Object.entries(options.params)
          .filter(([_, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => [key, String(value)])
      ).toString();

      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers = getAuthHeaders(options.headers || {});

    const config = {
      ...options,
      headers,
      timeout: API_CONFIG.TIMEOUT
    };

    // Remove params from config as it's not a valid fetch option
    delete config.params;

    try {
      console.log(`API Call: ${options.method || 'GET'} ${url}`, config.body ? JSON.parse(config.body) : null);

      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        console.log('API Error Response:', data);
        // Per errori di validazione, passa i details direttamente
        const details = data.details || data;
        throw new ApiError(data.error || 'Errore API', response.status, details);
      }
      
      return data;
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Errore di rete o parsing
      console.error('API Error:', error);
      throw new ApiError('Errore di connessione', 0, { originalError: error.message });
    }
  }
}

/**
 * Classe per errori API specifici
 */
export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
  
  /**
   * Verifica se è un errore di validazione
   */
  isValidationError() {
    return this.status === 400 && this.details && Array.isArray(this.details);
  }
  
  /**
   * Verifica se è un errore di autenticazione
   */
  isAuthError() {
    return this.status === 401;
  }
  
  /**
   * Verifica se è un errore di autorizzazione
   */
  isForbiddenError() {
    return this.status === 403;
  }
  
  /**
   * Verifica se è un errore di risorsa non trovata
   */
  isNotFoundError() {
    return this.status === 404;
  }
  
  /**
   * Verifica se è un errore di conflitto (es. email già esistente)
   */
  isConflictError() {
    return this.status === 409;
  }
}
