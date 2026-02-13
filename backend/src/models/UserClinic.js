const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * UserClinic Model
 * Maps to legacy app_user_clinic table
 * Represents the relationship between a user and a clinic (team)
 */
const UserClinic = sequelize.define('UserClinic', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  clinicId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'clinic_id'
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  datarequest: {
    type: DataTypes.DATE,
    allowNull: false
  },
  idcode: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'app_user_clinic',
  timestamps: false
});

module.exports = UserClinic;
