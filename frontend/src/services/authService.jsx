import { ApiClient, API_CONFIG } from '../config/api';

/**
 * Service per la gestione dell'autenticazione
 */
export class AuthService {
  
  /**
   * Registrazione nuovo utente consumer
   * @param {Object} userData - Dati dell'utente
   * @returns {Promise} - Promise con la risposta
   */
  static async registerConsumer(userData) {
    return ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER_CONSUMER, userData);
  }

  /**
   * Registrazione nuovo utente business (doctor/clinic)
   * @param {Object} businessData - Dati della struttura
   * @returns {Promise}
   */
  static async registerBusiness(businessData) {
    return ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER_BUSINESS, businessData);
  }
  
  /**
   * Login utente
   * @param {string} email - Email dell'utente
   * @param {string} password - Password dell'utente
   * @param {boolean} rememberMe - Mantieni login
   * @returns {Promise} - Promise con la risposta
   */
  static async login(email, password, rememberMe = false) {
    return ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
      rememberMe
    });
  }
  
  /**
   * Logout utente
   * @returns {Promise} - Promise con la risposta
   */
  static async logout() {
    try {
      const result = await ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      // Rimuovi token dal localStorage
      localStorage.removeItem('authToken');
      return result;
    } catch (error) {
      // Anche in caso di errore, rimuovi il token locale
      localStorage.removeItem('authToken');
      throw error;
    }
  }
  
  /**
   * Recupero password
   * @param {string} email - Email per il recupero
   * @returns {Promise} - Promise con la risposta
   */
  static async forgotPassword(email) {
    return ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }
  
  /**
   * Reset password con token
   * @param {string} token - Token di recupero
   * @param {string} newPassword - Nuova password
   * @returns {Promise} - Promise con la risposta
   */
  static async resetPassword(token, newPassword) {
    return ApiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword
    });
  }
  
  /**
   * Verifica validità token
   * @returns {Promise} - Promise con la risposta
   */
  static async verifyToken() {
    return ApiClient.get(API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN);
  }
  
  /**
   * Verifica se l'utente è loggato
   * @returns {boolean} - True se c'è un token valido
   */
  static isLoggedIn() {
    return !!localStorage.getItem('authToken');
  }
  
  /**
   * Ottieni token corrente
   * @returns {string|null} - Token JWT o null
   */
  static getToken() {
    return localStorage.getItem('authToken');
  }
  
  /**
   * Salva token di autenticazione
   * @param {string} token - Token JWT
   */
  static setToken(token) {
    localStorage.setItem('authToken', token);
  }
  
  /**
   * Rimuovi token di autenticazione
   */
  static removeToken() {
    localStorage.removeItem('authToken');
  }
}
