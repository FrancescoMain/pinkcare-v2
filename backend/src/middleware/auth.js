const jwt = require('jsonwebtoken');
const { User, Role, Team, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Authentication middleware
 * Protects routes and checks user permissions
 */
class AuthMiddleware {
  
  /**
   * Verify JWT token and extract user information
   */
  static async verifyToken(req, res, next) {
    try {
      const token = AuthMiddleware.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          error: 'Token di accesso mancante'
        });
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user with roles (without teams to avoid Sequelize's deleted field handling)
      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      if (!user) {
        return res.status(401).json({
          error: 'Utente non trovato'
        });
      }

      // Fetch teams using raw SQL to avoid Sequelize's hardcoded "deleted = false" boolean conversion
      const teamsQuery = `
        SELECT t.id, t.name, t.logo FROM app_team t
        INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
        WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      `;

      const teams = await sequelize.query(teamsQuery, {
        replacements: { userId: user.id },
        type: QueryTypes.SELECT
      });

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        birthday: user.birthday,
        roles: user.roles?.map(role => role.name) || [],
        teams: teams || []
      };
      
      req.token = decoded;
      next();
      
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token non valido'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token scaduto'
        });
      }
      
      res.status(500).json({
        error: 'Errore di autenticazione'
      });
    }
  }
  
  /**
   * Check if user has specific role
   * @param {string|string[]} requiredRoles - Required role(s)
   */
  static requireRole(requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return (req, res, next) => {
      if (!req.user || !req.user.roles) {
        return res.status(403).json({
          error: 'Accesso negato: ruoli non disponibili'
        });
      }
      
      const userRoles = req.user.roles;
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          error: 'Accesso negato: permessi insufficienti'
        });
      }
      
      next();
    };
  }
  
  /**
   * Check if user is consumer
   */
  static requireConsumer(req, res, next) {
    return AuthMiddleware.requireRole('ROLE_CONSUMER')(req, res, next);
  }
  
  /**
   * Check if user is business (doctor/clinic)
   */
  static requireBusiness(req, res, next) {
    return AuthMiddleware.requireRole('ROLE_BUSINESS')(req, res, next);
  }
  
  /**
   * Check if user is admin
   */
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole(['ROLE_PINKCARE', 'ROLE_ADMINISTRATION_SECTION'])(req, res, next);
  }
  
  /**
   * Check if user is consumer or business
   */
  static requireConsumerOrBusiness(req, res, next) {
    return AuthMiddleware.requireRole(['ROLE_CONSUMER', 'ROLE_BUSINESS'])(req, res, next);
  }
  
  /**
   * Optional authentication - doesn't fail if no token
   * But adds user info if token is present and valid
   */
  static async optionalAuth(req, res, next) {
    try {
      const token = AuthMiddleware.extractToken(req);
      
      if (!token) {
        return next();
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      if (user) {
        // Fetch teams using raw SQL (same reason as verifyToken)
        const teamsQuery = `
          SELECT t.id, t.name, t.logo FROM app_team t
          INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
          WHERE ut.app_user_id = :userId AND t.deleted = 'N'
        `;

        const teams = await sequelize.query(teamsQuery, {
          replacements: { userId: user.id },
          type: QueryTypes.SELECT
        });

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          birthday: user.birthday,
          roles: user.roles?.map(role => role.name) || [],
          teams: teams || []
        };
        req.token = decoded;
      }
      
      next();
      
    } catch (error) {
      // Ignore token errors in optional auth
      next();
    }
  }
  
  /**
   * Extract JWT token from Authorization header
   * @param {Object} req - Express request object
   * @returns {string|null} JWT token
   */
  static extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
  
  /**
   * Check if current user can access resource
   * Users can only access their own resources unless they're admin
   * @param {string} userIdParam - Parameter name containing user ID
   */
  static requireOwnershipOrAdmin(userIdParam = 'userId') {
    return (req, res, next) => {
      const targetUserId = parseInt(req.params[userIdParam]);
      const currentUserId = req.user?.id;
      const isAdmin = req.user?.roles?.some(role => 
        role === 'ROLE_PINKCARE' || role === 'ROLE_ADMINISTRATION_SECTION'
      );
      
      if (isAdmin || currentUserId === targetUserId) {
        return next();
      }
      
      res.status(403).json({
        error: 'Accesso negato: puoi accedere solo alle tue informazioni'
      });
    };
  }
}

module.exports = AuthMiddleware;