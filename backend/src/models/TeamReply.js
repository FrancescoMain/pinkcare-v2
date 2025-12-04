const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamReply = sequelize.define('TeamReply', {
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
  question_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'app_question',
      key: 'id'
    }
  },
  screening_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_screening',
      key: 'id'
    }
  },
  // Map model field 'reply' to database column 'answer'
  reply: {
    type: DataTypes.INTEGER,
    field: 'answer',
    comment: '-1: no, 1: yes'
  },
  // Map model field 'reply_string' to database column 'answer_string'
  reply_string: {
    type: DataTypes.STRING(25),
    field: 'answer_string',
    comment: 'String reply for select type questions'
  }
}, {
  tableName: 'app_team_reply',
  timestamps: false,
  underscored: true
});

module.exports = TeamReply;
