const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Join table between users and teams (app_user_app_team)
const UserTeam = sequelize.define('UserTeam', {
  userId: {
    type: DataTypes.BIGINT,
    field: 'app_user_id',
    primaryKey: true
  },
  teamId: {
    type: DataTypes.BIGINT,
    field: 'teams_id',
    primaryKey: true
  },
  removed: {
    type: DataTypes.CHAR(1),
    field: 'removed',
    defaultValue: 'N',
    allowNull: false
  },
  insertion: {
    type: DataTypes.DATE,
    field: 'insertion',
    defaultValue: DataTypes.NOW
  },
  modification: {
    type: DataTypes.DATE,
    field: 'modification',
    defaultValue: DataTypes.NOW
  },
  cancellation: {
    type: DataTypes.CHAR(1),
    field: 'cancellation',
    defaultValue: 'N',
    allowNull: false
  }
}, {
  tableName: 'app_user_app_team',
  timestamps: false
});

module.exports = UserTeam;
