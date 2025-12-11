const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * RecommendedExamination Model
 * Represents recommended/scheduled medical examinations
 * Table: app_recommended_examination
 */
const RecommendedExamination = sequelize.define('RecommendedExamination', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  teamId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'team_id',
    references: {
      model: 'app_team',
      key: 'id'
    },
    comment: 'Team (user) who owns this examination'
  },
  examinationId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'examination_id',
    references: {
      model: 'app_examination_pathology',
      key: 'id'
    },
    comment: 'Reference to examination type'
  },
  screeningId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'screening_id',
    references: {
      model: 'app_screening',
      key: 'id'
    },
    comment: 'Reference to screening that generated this recommendation'
  },
  protocolRuleId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'protocol_rule_id',
    references: {
      model: 'app_protocol_rules',
      key: 'id'
    },
    comment: 'Reference to protocol rule'
  },
  controlDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'control_date',
    comment: 'Scheduled control date'
  },
  nextControlDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_control_date',
    comment: 'Next scheduled control date'
  },
  calculatedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'calculated_date',
    comment: 'System calculated date'
  },
  periodicalControl: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'periodical_control',
    comment: 'Is this a periodical control'
  },
  confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'confirmed',
    comment: 'Has the examination been confirmed/completed'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'note',
    comment: 'Additional notes'
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'color',
    comment: 'Display color'
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'deleted',
    comment: 'Soft delete flag'
  },
  insertionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'insertion_date'
  },
  insertionUsername: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_modify_date'
  },
  lastModifyUsername: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'last_modify_username'
  }
}, {
  tableName: 'app_recommended_examination',
  timestamps: false,
  defaultScope: {
    where: {
      deleted: false
    }
  },
  scopes: {
    withDeleted: {}
  },
  indexes: [
    {
      name: 'idx_recommended_exam_team_date',
      fields: ['team_id', 'control_date', 'deleted']
    },
    {
      name: 'idx_recommended_exam_confirmed',
      fields: ['confirmed']
    }
  ]
});

module.exports = RecommendedExamination;
