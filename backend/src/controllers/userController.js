const { validationResult } = require('express-validator');
const userService = require('../services/userService');

/**
 * User Controller
 * Handles user profile management
 */
class UserController {
  
  /**
   * Get current user profile
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserProfile(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'Profilo utente non trovato'
        });
      }
      
      // Return user profile without sensitive data
      const userProfile = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        nickName: user.nickName,
        birthday: user.birthday,
        gender: user.gender,
        mobilePhone: user.mobilePhone,
        filledPersonalForm: user.filledPersonalForm,
        
        // Health information
        weight: user.weight,
        height: user.height,
        sedentaryLifestyle: user.sedentaryLifestyle,
        ageFirstMenstruation: user.ageFirstMenstruation,
        regularityMenstruation: user.regularityMenstruation,
        durationMenstruation: user.durationMenstruation,
        durationPeriod: user.durationPeriod,
        surgery: user.surgery,
        medicine: user.medicine,
        
        // Privacy settings
        agreeMarketing: user.agreeMarketing,
        agreeNewsletter: user.agreeNewsletter,
        
        // Metadata
        insertionDate: user.insertionDate,
        firstLoginDate: user.firstLoginDate,
        
        // Roles
        roles: user.roles?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        })) || []
      };
      
      res.json(userProfile);
      
    } catch (error) {
      console.error('Get profile error:', error);
      next(error);
    }
  }
  
  /**
   * Update current user profile
   * PUT /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }
      
      const userId = req.user.id;
      const updateData = req.body;
      
      const updatedUser = await userService.updateUserProfile(userId, updateData);
      
      // Return updated profile
      const userProfile = {
        id: updatedUser.id,
        name: updatedUser.name,
        surname: updatedUser.surname,
        email: updatedUser.email,
        nickName: updatedUser.nickName,
        birthday: updatedUser.birthday,
        gender: updatedUser.gender,
        mobilePhone: updatedUser.mobilePhone,
        filledPersonalForm: updatedUser.filledPersonalForm,
        
        // Health information
        weight: updatedUser.weight,
        height: updatedUser.height,
        sedentaryLifestyle: updatedUser.sedentaryLifestyle,
        ageFirstMenstruation: updatedUser.ageFirstMenstruation,
        regularityMenstruation: updatedUser.regularityMenstruation,
        durationMenstruation: updatedUser.durationMenstruation,
        durationPeriod: updatedUser.durationPeriod,
        surgery: updatedUser.surgery,
        medicine: updatedUser.medicine,
        
        // Privacy settings
        agreeMarketing: updatedUser.agreeMarketing,
        agreeNewsletter: updatedUser.agreeNewsletter,
        
        // Metadata
        lastModifyDate: updatedUser.lastModifyDate
      };
      
      res.json({
        message: 'Profilo aggiornato con successo',
        user: userProfile
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'Utente non trovato'
        });
      }
      
      next(error);
    }
  }
  
  /**
   * Get user by ID
   * GET /api/users/:userId
   */
  async getUserById(req, res, next) {
    try {
      const { userId } = req.params;
      const user = await userService.getUserProfile(parseInt(userId));

      if (!user) {
        return res.status(404).json({
          error: 'Utente non trovato'
        });
      }

      // Return limited profile information
      const userProfile = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        nickName: user.nickName,
        insertionDate: user.insertionDate,
        roles: user.roles?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        })) || []
      };

      res.json(userProfile);

    } catch (error) {
      console.error('Get user by ID error:', error);
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/users/password
   * Replicates legacy UserService.save(user, password) behavior
   */
  async changePassword(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Change password using service
      await userService.changePassword(userId, currentPassword, newPassword);

      res.json({
        message: 'Password aggiornata con successo'
      });

    } catch (error) {
      console.error('Change password error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'Utente non trovato'
        });
      }

      if (error.message === 'Invalid current password') {
        return res.status(400).json({
          error: 'Password attuale non corretta'
        });
      }

      next(error);
    }
  }
}

module.exports = new UserController();