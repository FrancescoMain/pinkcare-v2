const { User, Role, UserRole } = require('../models');
const PasswordUtils = require('../utils/passwordUtils');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * User Service - Business logic for user management
 * Based on it.tione.pinkcare.service.impl.UserServiceImpl.java
 */
class UserService {
  
  /**
   * Create new user (registration)
   * @param {object} userData - User registration data
   * @returns {Promise<User>} Created user
   */
  async createUser(userData) {
    const {
      name,
      surname,
      email,
      password,
      birthday,
      gender,
      nickName,
      agreeConditionAndPrivacy,
      agreeMarketing,
      agreeNewsletter,
      mobilePhone
    } = userData;
    
    // Validate password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      }
    });
    
    if (existingUser) {
      throw new Error('Email già registrata');
    }
    
    // Encode password using MD5 (for compatibility with Java system)
    const hashedPassword = PasswordUtils.encodeMD5(password);
    
    // Create user using raw SQL to properly handle sequence
    const userBirthday = birthday ? new Date(birthday) : null;
    const insertDate = new Date();
    
    const [userResult] = await sequelize.query(`
      INSERT INTO app_user (
        id, name, surname, email, username, password, birthday, gender, 
        nick_name, agree_condition_and_privacy, agree_marketing, agree_newsletter, 
        mobile_phone, insertion_date, last_modify_date, filled_personal_form,
        sedentary_lifestyle, regularity_menstruation
      ) VALUES (
        nextval('app_user_id_seq'), :name, :surname, :email, :username, :password, 
        :birthday, :gender, :nickName, :agreeConditionAndPrivacy, :agreeMarketing, 
        :agreeNewsletter, :mobilePhone, :insertionDate, :lastModifyDate, 
        :filledPersonalForm, :sedentaryLifestyle, :regularityMenstruation
      ) RETURNING *
    `, {
      replacements: {
        name: name.trim(),
        surname: surname.trim(),
        email: email.toLowerCase().trim(),
        username: email.toLowerCase().trim(),
        password: hashedPassword,
        birthday: userBirthday,
        gender: gender === 'true' || gender === true,
        nickName: nickName?.trim() || null,
        agreeConditionAndPrivacy: agreeConditionAndPrivacy === true,
        agreeMarketing: agreeMarketing === true,
        agreeNewsletter: agreeNewsletter === true,
        mobilePhone: mobilePhone?.trim() || null,
        insertionDate: insertDate,
        lastModifyDate: insertDate,
        filledPersonalForm: false,
        sedentaryLifestyle: false,
        regularityMenstruation: false
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    const user = userResult[0];
    
    // Assign default role (CONSUMER)
    await this.assignRole(user.id, 'ROLE_CONSUMER');
    
    // Return user with roles populated
    return await this.getUserProfile(user.id);
  }
  
  /**
   * Authenticate user (login)
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<User|null>} Authenticated user or null
   */
  async authenticateUser(email, password) {
    if (!email || !password) {
      return null;
    }
    
    // Find user by email/username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      },
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'description']
      }]
    });
    
    if (!user) {
      return null;
    }
    
    // Verify password using MD5
    const isPasswordValid = PasswordUtils.verifyMD5(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    
    // Update first login date if not set
    if (!user.firstLoginDate) {
      user.firstLoginDate = new Date();
      user.lastModifyDate = new Date();
      await user.save();
    }
    
    return user;
  }
  
  /**
   * Assign role to user
   * @param {number} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<UserRole>} Created user role
   */
  async assignRole(userId, roleName) {
    // Find role by name
    const role = await Role.findOne({
      where: { name: roleName }
    });
    
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }
    
    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      where: {
        userId: userId,
        roleId: role.id
      }
    });
    
    if (existingUserRole) {
      return existingUserRole;
    }
    
    // Create user role
    return await UserRole.create({
      userId: userId,
      roleId: role.id,
      insertion: true,
      modification: false,
      cancellation: false
    });
  }
  
  /**
   * Get user profile with roles
   * @param {number} userId - User ID
   * @returns {Promise<User|null>} User with roles
   */
  async getUserProfile(userId) {
    return await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'description']
      }]
    });
  }
  
  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {object} updateData - Data to update
   * @returns {Promise<User>} Updated user
   */
  async updateUserProfile(userId, updateData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove sensitive fields that shouldn't be updated directly
    const allowedFields = [
      'name', 'surname', 'nickName', 'birthday', 'gender',
      'mobilePhone', 'weight', 'height', 'sedentaryLifestyle',
      'ageFirstMenstruation', 'regularityMenstruation',
      'durationMenstruation', 'durationPeriod', 'surgery', 'medicine',
      'agreeMarketing', 'agreeNewsletter'
    ];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });
    
    filteredData.lastModifyDate = new Date();
    filteredData.filledPersonalForm = true;
    
    await user.update(filteredData);
    return user;
  }
  
  /**
   * Initiate password recovery
   * @param {string} email - User email
   * @returns {Promise<object>} User data and recovery token
   */
  async initiatePasswordRecovery(email) {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: email.toLowerCase() }
        ]
      }
    });
    
    if (!user) {
      throw new Error('Email non trovata');
    }
    
    // Generate recovery token
    const recoveryToken = PasswordUtils.generateRandomPassword(32);
    
    // Save recovery token (encoded with MD5)
    user.passwordRecovery = PasswordUtils.encodeMD5(recoveryToken);
    user.lastModifyDate = new Date();
    await user.save();
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token: recoveryToken
    };
  }
  
  /**
   * Reset password using recovery token
   * @param {string} token - Recovery token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetPassword(token, newPassword) {
    // Validate new password
    const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    const hashedToken = PasswordUtils.encodeMD5(token);
    
    const user = await User.findOne({
      where: { passwordRecovery: hashedToken }
    });
    
    if (!user) {
      throw new Error('Token di recupero non valido');
    }
    
    // Update password and clear recovery token
    user.password = PasswordUtils.encodeMD5(newPassword);
    user.passwordRecovery = null;
    user.lastModifyDate = new Date();
    
    await user.save();
    return true;
  }
}

module.exports = new UserService();