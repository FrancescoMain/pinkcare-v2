const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type_question: {
    type: DataTypes.STRING,
    comment: 'yes_or_no, select, text'
  },
  question_values: {
    type: DataTypes.TEXT,
    comment: 'Values separated by semicolon for select type questions'
  },
  root_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_question',
      key: 'id'
    }
  }
}, {
  tableName: 'app_question',
  timestamps: false,
  underscored: true
});

module.exports = Question;
