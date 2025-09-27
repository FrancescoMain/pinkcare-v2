const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Typology model based on it.tione.pinkcare.model.Typology.java
const Typology = sequelize.define('Typology', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pertinence: {
    type: DataTypes.STRING,
    allowNull: true
  },
  business: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'app_typology',
  timestamps: false
});

// Static ids mirroring legacy constants
Typology.IDS = {
  ADMINISTRATOR: 1,
  CONSUMER: 2,
  DOCTOR: 3,
  CLINIC: 4,
  BASIC: -1,
};

Typology.PERTINENCE = {
  TEAM: 'team',
  TITLE: 'title',
  MEDICAL_TITLE: 'medical_title'
};

module.exports = Typology;
