const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Role model based on it.tione.pinkcare.model.Role.java
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING
  },
  level: {
    type: DataTypes.BIGINT
  },
  visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'app_role',
  timestamps: false
});

module.exports = Role;