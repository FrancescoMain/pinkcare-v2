const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * TeamExaminationPathology model
 * Join table between Team and ExaminationPathology
 * Links doctors/clinics to the examinations/pathologies they offer
 */
const TeamExaminationPathology = sequelize.define('TeamExaminationPathology', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  insertionDate: {
    type: DataTypes.DATE,
    field: 'insertion_date',
    defaultValue: DataTypes.NOW
  },
  insertionUsername: {
    type: DataTypes.STRING,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    field: 'last_modify_date',
    defaultValue: DataTypes.NOW
  },
  lastModifyUsername: {
    type: DataTypes.STRING,
    field: 'last_modify_username'
  },
  validated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  teamId: {
    type: DataTypes.BIGINT,
    field: 'team_id',
    allowNull: false
  },
  examinationPathologyId: {
    type: DataTypes.BIGINT,
    field: 'examination_pathology_id',
    allowNull: false
  }
}, {
  tableName: 'app_team_examination_pathology',
  timestamps: false,
  defaultScope: {
    where: {
      deleted: false
    }
  },
  scopes: {
    withDeleted: {
      where: {}
    }
  }
});

module.exports = TeamExaminationPathology;
