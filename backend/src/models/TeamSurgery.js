const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// TeamSurgery model - represents surgeries for a team/user
const TeamSurgery = sequelize.define('TeamSurgery', {
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

  // Surgery information
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Soft delete flag'
  },
  executed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the surgery was executed'
  },
  description: {
    type: DataTypes.STRING,
    comment: 'Additional description for the surgery'
  },

  // Foreign keys
  teamId: {
    type: DataTypes.BIGINT,
    field: 'team_id',
    allowNull: false,
    comment: 'Reference to app_team'
  },
  surgeryId: {
    type: DataTypes.BIGINT,
    field: 'surgery_id',
    allowNull: false,
    comment: 'Reference to surgery type'
  }
}, {
  tableName: 'app_team_surgery',
  timestamps: false,
  indexes: [
    {
      name: 'idx_team_surgery_team',
      fields: ['team_id']
    },
    {
      name: 'idx_team_surgery_surgery',
      fields: ['surgery_id']
    }
  ]
});

module.exports = TeamSurgery;
