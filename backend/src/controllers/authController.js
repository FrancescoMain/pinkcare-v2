const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const userService = require('../services/userService');
const teamService = require('../services/teamService');
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
    const transaction = await sequelize.transaction();
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const userData = req.body;

      // Validate required privacy agreement
      if (!userData.agreeConditionAndPrivacy) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Devi accettare i termini e condizioni per il trattamento dei dati sensibili'
        });
      }

      // Create user
      const user = await userService.createUser(userData, { transaction });

      // Create consumer team for the user
      const team = await teamService.createConsumerTeam({ user }, { transaction });

      await transaction.commit();

      // Send welcome email (legacy behavior - sends password in plain text)
      try {
        const fullName = `${user.name} ${user.surname}`;
        await emailService.sendWelcomeEmail(
          user.email,
          fullName,
          userData.password // Plain password for welcome email (like legacy)
        );
        console.log('Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
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
        birthday: user.birthday,
        filledPersonalForm: user.filledPersonalForm,
        insertionDate: user.insertionDate
      };

      res.status(201).json({
        message: 'Processo completato. Controlla la tua email per completare la registrazione.',
        user: userResponse,
        team: {
          id: team.id,
          name: team.name
        },
        token
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Registration error:', error);

      // Handle unique constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path;
        if (field === 'email' || field === 'username') {
          return res.status(409).json({
            error: 'Email già registrata'
          });
        }
        if (field === 'nick_name') {
          return res.status(409).json({
            error: 'Nickname già utilizzato, scegline un altro'
          });
        }
        return res.status(409).json({
          error: 'Questo valore è già stato utilizzato'
        });
      }

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
   * Register new business user (doctor/clinic)
   * POST /api/auth/register-business
   */
  async registerBusiness(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const {
        name,
        surname,
        email,
        password,
        gender,
        nickName,
        mobilePhone,
        businessType,
        medicalTitle,
        structureName,
        address,
        agreeConditionAndPrivacy,
        agreeToBeShown,
        agreeMarketing,
        agreeNewsletter,
        taxCode,
        vatNumber,
        landlinePhone,
        website,
        secondEmail
      } = req.body;

      const user = await userService.createBusinessUser({
        name,
        surname,
        email,
        password,
        gender,
        nickName,
        mobilePhone,
        agreeConditionAndPrivacy,
        agreeToBeShown,
        agreeMarketing,
        agreeNewsletter
      }, { transaction });

      const team = await teamService.createBusinessTeam({
        user,
        businessData: {
          businessType,
          medicalTitle,
          name: structureName,
          address,
          email: secondEmail || email,
          taxCode,
          vatNumber,
          landlinePhone,
          mobilePhone,
          website,
          secondEmail
        }
      }, { transaction });

      await transaction.commit();

      // Send welcome email (failure does not block registration)
      try {
        await emailService.sendWelcomeEmail(user.email, `${user.name || ''} ${user.surname || ''}`.trim(), password);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      const userResponse = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        roles: user.roles?.map(role => ({
          id: role.id,
          nome: role.name,
          descrizione: role.description
        })) || []
      };

      res.status(201).json({
        message: 'Registrazione completata. Controlla la tua email per proseguire.',
        user: userResponse,
        team: {
          id: team.id,
          name: team.name,
          typeId: team.typeId,
          titleId: team.titleId,
          medicalTitle: team.medicalTitle
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Business registration error:', error);

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

      if (error.message.includes('termini') || error.message.includes('visibile')) {
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
        birthday: user.birthday,
        filledPersonalForm: user.filledPersonalForm,
        firstLoginDate: user.firstLoginDate,
        height: user.height,
        weight: user.weight,
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
        // Use LEGACY password recovery method to match Java implementation
        const result = await userService.initiateLegacyPasswordRecovery(email);

        if (result && result.user && result.tempPassword) {
          // Send LEGACY recovery email
          const fullName = `${result.user.name} ${result.user.surname}`;
          try {
            await emailService.sendPasswordRecoveryLegacy(
              result.user.email,
              fullName,
              result.user.username || result.user.email,
              result.tempPassword,
              result.user.id,
              result.encodedPassword
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
   * Validate password recovery link (legacy format: userId$hash)
   * GET /api/auth/password-recovery
   */
  async validateRecoveryLink(req, res) {
    try {
      const { code } = req.query;
      const frontendUrl = process.env.APP_URL || 'http://localhost:3000';

      if (!code) {
        return res.redirect(`${frontendUrl}/login?res=-1`); // Malformed link
      }

      const result = await userService.validatePasswordRecoveryLink(code);

      if (result.success) {
        // Success - redirect to login
        return res.redirect(`${frontendUrl}/login?res=0`);
      } else {
        // Error - redirect with error code
        return res.redirect(`${frontendUrl}/login?res=${result.error}`);
      }

    } catch (error) {
      console.error('Recovery link validation error:', error);
      return res.redirect(`${frontendUrl}/login?res=-1`);
    }
  }

  /**
   * Change password for authenticated user
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId; // From JWT middleware

      await userService.changePassword(userId, currentPassword, newPassword);

      res.json({
        message: 'Password modificata con successo'
      });

    } catch (error) {
      console.error('Change password error:', error);

      if (error.message.includes('Password') || error.message.includes('Utente')) {
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
        birthday: user.birthday,
        filledPersonalForm: user.filledPersonalForm,
        height: user.height,
        weight: user.weight,
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
