const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CalendarEvent Model
 * Represents calendar events for menstrual cycle tracking
 * Table: app_calendar_event
 */
const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  beginning: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'beginning',
    comment: 'Event start date/time'
  },
  ending: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ending',
    comment: 'Event end date/time (for multi-day events)'
  },
  value: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    field: 'value',
    comment: 'Numeric value (weight in kg, temperature in °C)'
  },
  typeId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'type_id',
    references: {
      model: 'app_typology',
      key: 'id'
    },
    comment: 'Event type: MENSES(20), TEMPERATURE(21), WEIGHT(22), SYMPTOMS(23), DRUGS(24), MOODS(25), PREGNANCY(29)'
  },
  teamId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'team_id',
    references: {
      model: 'app_team',
      key: 'id'
    },
    comment: 'Team (user) who owns this event'
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
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'insertion_date'
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
  tableName: 'app_calendar_event',
  timestamps: false,
  indexes: [
    {
      name: 'idx_calendar_event_team_date',
      fields: ['team_id', 'beginning', 'deleted']
    },
    {
      name: 'idx_calendar_event_type',
      fields: ['type_id']
    }
  ]
});

module.exports = CalendarEvent;
