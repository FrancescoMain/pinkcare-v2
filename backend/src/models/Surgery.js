const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Surgery model - represents types of surgeries
const Surgery = sequelize.define('Surgery', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  // Audit fields
  insertionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'insertion_date'
  },
  insertionUsername: {
    type: DataTypes.STRING,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'last_modify_date'
  },
  lastModifyUsername: {
    type: DataTypes.STRING,
    field: 'last_modify_username'
  },

  // Surgery details
  label: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Surgery name/label'
  },
  openAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'open_answer',
    comment: 'Whether this surgery requires an open text description'
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Soft delete flag'
  },
  rootId: {
    type: DataTypes.BIGINT,
    field: 'root_id',
    allowNull: true,
    comment: 'Parent surgery ID for sub-surgeries (null for root surgeries)'
  },
  labelInfo: {
    type: DataTypes.STRING,
    field: 'label_info',
    allowNull: true,
    comment: 'Additional info about the surgery'
  }
}, {
  tableName: 'app_surgery',
  timestamps: false,
  defaultScope: {
    where: {
      deleted: false
    }
  }
});

module.exports = Surgery;
