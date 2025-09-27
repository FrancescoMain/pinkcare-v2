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
  }
}, {
  tableName: 'app_user_app_team',
  timestamps: false
});

module.exports = UserTeam;
