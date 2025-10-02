const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Protocol = sequelize.define('Protocol', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  age_range: {
    type: DataTypes.STRING
  },
  inferior_limit: {
    type: DataTypes.INTEGER
  },
  superior_limit: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'app_protocol',
  timestamps: false
});

module.exports = Protocol;
