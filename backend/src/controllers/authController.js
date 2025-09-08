const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const emailService = require('../services/emailService');

/**
 * Authentication Controller
 * Handles user registration, login, logout, password recovery
 */
class AuthController {
  
  /**
   * Register new consumer user
   * POST /api/auth/register-consumer
   */
  async registerConsumer(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }
      
      const userData = req.body;
      
      // Validate required privacy agreement
      if (!userData.agreeConditionAndPrivacy) {
        return res.status(400).json({
          error: 'Devi accettare i termini e condizioni per il trattamento dei dati sensibili'
        });
      }
      
      // Create user
      const user = await userService.createUser(userData);
      
      // Send confirmation email
      try {
        await emailService.sendRegistrationConfirmation(
          user.email, 
          user.name, 
          'temp-confirmation-token-' + user.id
        );
        console.log('Registration confirmation email sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
        // Don't fail registration if email fails
      }
      
      // Generate JWT token
      const token = this.generateToken(user);
      
      // Return user data without password
      const userResponse = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        nickName: user.nickName,
        filledPersonalForm: user.filledPersonalForm,
        insertionDate: user.insertionDate
      };
      
      res.status(201).json({
        message: 'Processo completato. Controlla la tua email per completare la registrazione.',
        user: userResponse,
        token
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('già registrata')) {
        return res.status(409).json({
          error: error.message
        });
      }
      
      if (error.message.includes('Password')) {
        return res.status(400).json({
          error: error.message
        });
      }
      
      next(error);
    }
  }
  
  /**
   * User login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }
      
      const { email, password, rememberMe } = req.body;
      
      // Authenticate user
      const user = await userService.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({
          error: 'Email o password non corretti'
        });
      }
      
      // Generate JWT token
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const token = this.generateToken(user, tokenExpiry);
      
      // Return user data with roles
      const userResponse = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        nickName: user.nickName,
        filledPersonalForm: user.filledPersonalForm,
        firstLoginDate: user.firstLoginDate,
        roles: user.roles?.map(role => ({
          id: role.id,
          nome: role.name,
          descrizione: role.description
        })) || []
      };
      
      res.json({
        message: 'Login effettuato con successo',
        user: userResponse,
        token
      });
      
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  }
  
  /**
   * Initiate password recovery
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }
      
      const { email } = req.body;
      
      try {
        const result = await userService.initiatePasswordRecovery(email);
        
        if (result && result.user && result.token) {
          // Send recovery email
          try {
            await emailService.sendPasswordRecovery(
              result.user.email,
              result.user.name,
              result.token
            );
            console.log('Password recovery email sent to:', result.user.email);
          } catch (emailError) {
            console.error('Failed to send password recovery email:', emailError);
          }
        }
        
        res.json({
          message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il recupero password'
        });
        
      } catch (error) {
        // Don't expose whether email exists or not
        res.json({
          message: 'Se l\'email esiste nel sistema, riceverai le istruzioni per il recupero password'
        });
      }
      
    } catch (error) {
      console.error('Forgot password error:', error);
      next(error);
    }
  }
  
  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }
      
      const { token, newPassword } = req.body;
      
      await userService.resetPassword(token, newPassword);
      
      res.json({
        message: 'Password reimpostata con successo'
      });
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('Token') || error.message.includes('Password')) {
        return res.status(400).json({
          error: error.message
        });
      }
      
      next(error);
    }
  }
  
  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res) {
    // With JWT, logout is handled client-side by removing the token
    // For additional security, you could implement a token blacklist
    res.json({
      message: 'Logout effettuato con successo'
    });
  }
  
  /**
   * Verify JWT token
   * GET /api/auth/verify
   */
  async verifyToken(req, res) {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          error: 'Token mancante'
        });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userService.getUserProfile(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          error: 'Utente non trovato'
        });
      }
      
      const userResponse = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        nickName: user.nickName,
        filledPersonalForm: user.filledPersonalForm,
        roles: user.roles?.map(role => ({
          id: role.id,
          nome: role.name,
          descrizione: role.description
        })) || []
      };
      
      res.json({
        valid: true,
        user: userResponse
      });
      
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({
        error: 'Token non valido'
      });
    }
  }
  
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @param {string} expiresIn - Token expiration
   * @returns {string} JWT token
   */
  generateToken(user, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles?.map(role => role.name) || []
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      issuer: 'pinkcare-api',
      audience: 'pinkcare-frontend'
    });
  }
  
  /**
   * Extract JWT token from request
   * @param {Object} req - Express request object
   * @returns {string|null} JWT token
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}

module.exports = new AuthController();