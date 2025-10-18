const { User, Role, UserRole } = require('../models');
const PasswordUtils = require('../utils/passwordUtils');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * User Service - Business logic for user management
 * Based on it.tione.pinkcare.service.impl.UserServiceImpl.java
 */
class UserService {
  toBoolean(value) {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }
    return Boolean(value);
  }

  async ensureUserDoesNotExist(email, options = {}) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username: email }
        ]
      },
      transaction: options.transaction
    });

    if (existingUser) {
      console.log(`[UserService] Email check failed: "${email}" already exists as:`, {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        insertionDate: existingUser.insertionDate
      });
      throw new Error('Email già registrata');
    }
  }

  async insertUserRecord(userPayload, options = {}) {
    const {
      email,
      password,
      name,
      surname,
      birthday,
      gender,
      nickName,
      mobilePhone,
      agreeConditionAndPrivacy,
      agreeToBeShown,
      agreeMarketing,
      agreeNewsletter
    } = userPayload;

    const passwordValidation = PasswordUtils.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Basic email normalization (lowercase and trim only, allow Gmail aliases)
    const normalizedEmail = email.toLowerCase().trim();
    await this.ensureUserDoesNotExist(normalizedEmail, options);

    const hashedPassword = PasswordUtils.encodeMD5(password);
    const userBirthday = birthday ? new Date(birthday) : null;
    const insertDate = new Date();
    const genderValue = this.toBoolean(gender);

    const sql = `
      INSERT INTO app_user (
        id,
        accountnonexpired,
        accountnonlocked,
        credentialsnonexpired,
        deleted,
        email,
        enabled,
        help_password,
        insertion_date,
        insertion_username,
        last_modify_date,
        last_modify_username,
        mobile_phone,
        name,
        name_to_validate,
        password,
        surname,
        surname_to_validate,
        username,
        password_recovery,
        birthday,
        gender,
        agree_condition_and_privacy,
        agree_marketing,
        agree_newsletter,
        agree_to_be_shown,
        nick_name,
        filled_personal_form,
        sedentary_lifestyle,
        regularity_menstruation
      ) VALUES (
        nextval('app_user_id_seq'),
        :accountNonExpired,
        :accountNonLocked,
        :credentialsNonExpired,
        :deleted,
        :email,
        :enabled,
        :helpPassword,
        :insertionDate,
        :insertionUsername,
        :lastModifyDate,
        :lastModifyUsername,
        :mobilePhone,
        :name,
        :nameToValidate,
        :password,
        :surname,
        :surnameToValidate,
        :username,
        :passwordRecovery,
        :birthday,
        :gender,
        :agreeConditionAndPrivacy,
        :agreeMarketing,
        :agreeNewsletter,
        :agreeToBeShown,
        :nickName,
        :filledPersonalForm,
        :sedentaryLifestyle,
        :regularityMenstruation
      ) RETURNING *
    `;

    const replacements = {
      name: name ? name.trim() : null,
      nameToValidate: null,
      surname: surname ? surname.trim() : null,
      surnameToValidate: null,
      email: normalizedEmail,
      username: normalizedEmail,
      password: hashedPassword,
      birthday: userBirthday,
      gender: genderValue === null ? null : genderValue,
      nickName: nickName?.trim() || null,
      agreeConditionAndPrivacy: agreeConditionAndPrivacy === true,
      agreeMarketing: agreeMarketing === true,
      agreeNewsletter: agreeNewsletter === true,
      agreeToBeShown: agreeToBeShown === true,
      mobilePhone: mobilePhone?.trim() || null,
      insertionDate: insertDate,
      insertionUsername: null,
      lastModifyDate: insertDate,
      lastModifyUsername: null,
      passwordRecovery: null,
      filledPersonalForm: false,
      sedentaryLifestyle: false,
      regularityMenstruation: false,
      accountNonExpired: 'Y',
      accountNonLocked: 'Y',
      credentialsNonExpired: 'Y',
      deleted: false,
      enabled: 'Y',
      helpPassword: null
    };

    const [userResult] = await sequelize.query(sql, {
      replacements,
      transaction: options.transaction,
      type: sequelize.QueryTypes.INSERT
    });

    return userResult[0];
  }

  async assignRoles(userId, roles = [], options = {}) {
    for (const roleName of roles) {
      await this.assignRole(userId, roleName, options);
    }
  }

  /**
   * Create new consumer user (legacy private registration)
   * @param {object} userData
   * @param {object} options
   * @returns {Promise<User>}
   */
  async createUser(userData, options = {}) {
    const user = await this.insertUserRecord({
      ...userData,
      agreeToBeShown: userData.agreeToBeShown === true
    }, options);

    await this.assignRoles(user.id, ['ROLE_USER', 'ROLE_CONSUMER'], options);

    return this.getUserProfile(user.id, options);
  }

  /**
   * Create new business user (doctor/clinic)
   * @param {object} userData
   * @param {object} options
   * @returns {Promise<User>}
   */
  async createBusinessUser(userData, options = {}) {
    if (!userData.agreeConditionAndPrivacy) {
      throw new Error('Devi accettare i termini e condizioni per il trattamento dei dati sensibili');
    }
    if (!userData.agreeToBeShown) {
      throw new Error('Devi acconsentire ad essere visibile sul portale');
    }

    const user = await this.insertUserRecord({
      ...userData,
      agreeToBeShown: true
    }, options);

    await this.assignRoles(user.id, ['ROLE_USER', 'ROLE_BUSINESS'], options);

    return this.getUserProfile(user.id, options);
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

    // Basic email normalization (lowercase and trim only)
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email/username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { username: normalizedEmail }
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
  async assignRole(userId, roleName, options = {}) {
    // Find role by name
    const role = await Role.findOne({
      where: { name: roleName },
      transaction: options.transaction
    });
    
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }
    
    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      where: {
        userId: userId,
        roleId: role.id
      },
      transaction: options.transaction
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
    }, { transaction: options.transaction });
  }
  
  /**
   * Get user profile with roles
   * @param {number} userId - User ID
   * @returns {Promise<User|null>} User with roles
   */
  async getUserProfile(userId, options = {}) {
    return await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['id', 'name', 'description']
      }],
      transaction: options.transaction
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
    // Basic email normalization (lowercase and trim only)
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { username: normalizedEmail }
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

  /**
   * Validate legacy-style password recovery link
   * Legacy format: userId$encodedRecoveryCode
   * @param {string} code - Recovery code in format userId$hash
   * @returns {Promise<{success: boolean, error?: number}>}
   */
  async validatePasswordRecoveryLink(code) {
    try {
      const parts = code.split('$');
      if (parts.length !== 2) {
        return { success: false, error: -1 }; // Malformed link
      }

      const userId = parseInt(parts[0]);
      const providedHash = parts[1];

      const user = await User.findByPk(userId);
      if (!user) {
        return { success: false, error: -1 }; // User not found
      }

      // Check if recovery process is still active
      if (!user.passwordRecovery) {
        return { success: false, error: -2 }; // Already finalized or never started
      }

      // Verify the recovery code (it's already hashed in DB)
      if (user.passwordRecovery !== providedHash) {
        return { success: false, error: -3 }; // Verification code incorrect
      }

      // Valid! Set the new password and clear recovery
      user.password = providedHash; // Use the hash as new password
      user.passwordRecovery = null; // Clear recovery code
      user.lastModifyDate = new Date();
      await user.save();

      return { success: true };
    } catch (error) {
      console.error('Password recovery validation error:', error);
      return { success: false, error: -1 };
    }
  }

  /**
   * Initiate password recovery (legacy-compatible)
   * Generates a temporary password and sends email with link
   * @param {string} email - User email
   * @returns {Promise<object>} User data and recovery info
   */
  async initiateLegacyPasswordRecovery(email) {
    // Basic email normalization (lowercase and trim only)
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { username: normalizedEmail }
        ]
      }
    });

    if (!user) {
      throw new Error('Email non trovata');
    }

    // Generate temporary password (9 chars like legacy)
    const tempPassword = PasswordUtils.generateRandomPassword(9);

    // Encode it with MD5
    const encodedPassword = PasswordUtils.encodeMD5(tempPassword);

    // Save encoded password as recovery token
    user.passwordRecovery = encodedPassword;
    user.lastModifyDate = new Date();
    await user.save();

    // Return data for email
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        username: user.username || user.email
      },
      tempPassword: tempPassword,  // Plain text for email
      encodedPassword: encodedPassword  // Hashed for link
    };
  }

  /**
   * Change user password
   * Replicates legacy UserService.save(user, password) behavior
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Utente non trovato');
    }

    // Verify current password
    const isCurrentPasswordValid = PasswordUtils.verifyMD5(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Password attuale non corretta');
    }

    // Validate new password strength
    const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Update password (using MD5 like legacy system)
    user.password = PasswordUtils.encodeMD5(newPassword);
    user.lastModifyDate = new Date();
    user.lastModifyUsername = user.username;

    await user.save();
    return true;
  }
}

module.exports = new UserService();
