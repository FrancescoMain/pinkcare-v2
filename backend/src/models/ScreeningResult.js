const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ScreeningResult = sequelize.define('ScreeningResult', {
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
  screening_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'app_screening',
      key: 'id'
    }
  },
  result_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_recommended_examination',
      key: 'id'
    },
    comment: 'Recommended examination suggested by screening'
  }
}, {
  tableName: 'app_screening_result',
  timestamps: false,
  underscored: true
});

module.exports = ScreeningResult;
