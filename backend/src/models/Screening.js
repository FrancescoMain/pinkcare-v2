const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Screening = sequelize.define('Screening', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  insertion_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  insertion_username: {
    type: DataTypes.STRING
  },
  last_modify_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_modify_username: {
    type: DataTypes.STRING
  },
  team_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'app_team',
      key: 'id'
    }
  },
  thematic_area_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_thematic_areas',
      key: 'id'
    }
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'app_screening',
  timestamps: false,
  underscored: true
});

module.exports = Screening;
