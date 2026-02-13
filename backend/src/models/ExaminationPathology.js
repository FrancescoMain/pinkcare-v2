const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExaminationPathology = sequelize.define('ExaminationPathology', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  label: {
    type: DataTypes.STRING
  },
  examination: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  periodicalControlDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'periodical_control_days'
  }
}, {
  tableName: 'app_examination_pathology',
  timestamps: false
});

module.exports = ExaminationPathology;
