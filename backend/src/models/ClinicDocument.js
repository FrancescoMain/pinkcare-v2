const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ClinicDocument Model
 * Maps to legacy app_clinic_document table
 * Stores documents uploaded by clinics/doctors for users
 */
const ClinicDocument = sequelize.define('ClinicDocument', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  appUserClinicId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'app_user_clinic_id'
  },
  details: {
    type: DataTypes.STRING(250),
    allowNull: true
  },
  doc: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nameFile: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'name_file'
  },
  dataLoad: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_load'
  }
}, {
  tableName: 'app_clinic_document',
  timestamps: false
});

module.exports = ClinicDocument;
