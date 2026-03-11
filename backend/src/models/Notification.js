const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  insertionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'insertion_date',
    defaultValue: DataTypes.NOW
  },
  insertionUsername: {
    type: DataTypes.STRING,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    field: 'last_modify_date'
  },
  lastModifyUsername: {
    type: DataTypes.STRING,
    field: 'last_modify_username'
  },
  message: {
    type: DataTypes.TEXT
  },
  title: {
    type: DataTypes.STRING
  },
  beginning: {
    type: DataTypes.DATE
  },
  ending: {
    type: DataTypes.DATE
  },
  reminder: {
    type: DataTypes.DATE
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hideBy: {
    type: DataTypes.STRING,
    field: 'hide_by'
  },
  hidingDate: {
    type: DataTypes.DATE,
    field: 'hiding_date'
  },
  typologyId: {
    type: DataTypes.BIGINT,
    field: 'typology_id'
  },
  userId: {
    type: DataTypes.BIGINT,
    field: 'user_id'
  },
  teamId: {
    type: DataTypes.BIGINT,
    field: 'team_id'
  },
  notifyById: {
    type: DataTypes.BIGINT,
    field: 'notify_by_id'
  }
}, {
  tableName: 'app_notice',
  timestamps: false,
  defaultScope: {
    where: { deleted: false }
  }
});

// Typology IDs for notifications (from legacy Typology.java)
Notification.TYPOLOGY = {
  CHANGE_PASSWORD: 10,
  READING_NOTIFICATION: 11,
  BUSINESS_CHANGES: 12,
  EXAMINATION_CONTROL: 13
};

module.exports = Notification;
