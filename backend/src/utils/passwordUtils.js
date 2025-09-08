const crypto = require('crypto');
const CryptoJS = require('crypto-js');

/**
 * Password utilities to maintain compatibility with Java Spring MD5 encoding
 * Based on org.springframework.security.authentication.encoding.Md5PasswordEncoder
 */
class PasswordUtils {
  
  /**
   * Encode password using MD5 (for compatibility with existing Java system)
   * @param {string} password - Plain text password
   * @param {string|null} salt - Salt (not used in current Java implementation)
   * @returns {string} MD5 encoded password
   */
  static encodeMD5(password, salt = null) {
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    
    // Using crypto-js for exact compatibility with Java MD5
    return CryptoJS.MD5(password).toString();
  }
  
  /**
   * Verify password against MD5 hash
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - MD5 hashed password from database
   * @returns {boolean} True if passwords match
   */
  static verifyMD5(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      return false;
    }
    
    const encodedPassword = this.encodeMD5(plainPassword);
    return encodedPassword === hashedPassword;
  }
  
  /**
   * Generate random password for recovery
   * @param {number} length - Password length (default 12)
   * @returns {string} Random password
   */
  static generateRandomPassword(length = 12) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with isValid and errors
   */
  static validatePasswordStrength(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password è obbligatoria');
      return { isValid: false, errors };
    }
    
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.push('Formato password non corretto');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PasswordUtils;