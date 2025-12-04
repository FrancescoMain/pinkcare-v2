const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProtocolRule = sequelize.define('ProtocolRule', {
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
  protocol_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_protocol',
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
  examination_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_examination_pathology',
      key: 'id'
    }
  },
  question_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'app_question',
      key: 'id'
    }
  },
  has_sub_question: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  answer: {
    type: DataTypes.INTEGER,
    comment: '-1: false/no, 1: true/yes'
  },
  week_inferior_limit: {
    type: DataTypes.INTEGER
  },
  week_superior_limit: {
    type: DataTypes.INTEGER
  },
  examination_info: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'app_protocol_rules',
  timestamps: false,
  underscored: true
});

module.exports = ProtocolRule;
