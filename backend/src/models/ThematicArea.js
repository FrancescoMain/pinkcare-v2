const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ThematicArea = sequelize.define('ThematicArea', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  label: {
    type: DataTypes.STRING
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'app_thematic_area',
  timestamps: false
});

module.exports = ThematicArea;
