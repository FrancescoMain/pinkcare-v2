const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// UserRole model based on it.tione.pinkcare.model.UserRole.java
const UserRole = sequelize.define('UserRole', {
  userId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    field: 'user_id',
    references: {
      model: 'app_user',
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    field: 'role_id',
    references: {
      model: 'app_role',
      key: 'id'
    }
  },
  cancellation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  insertion: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  modification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'app_user_app_role',
  timestamps: false
});

module.exports = UserRole;