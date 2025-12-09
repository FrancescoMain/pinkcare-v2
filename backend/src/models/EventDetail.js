const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EventDetail Model
 * Represents details for calendar events (symptoms, drugs, moods)
 * Table: app_event_detail
 */
const EventDetail = sequelize.define('EventDetail', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'value',
    comment: 'Intensity value 0-3 for symptoms/moods, null for drugs'
  },
  eventId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'event_id',
    references: {
      model: 'app_calendar_event',
      key: 'id'
    },
    comment: 'Parent calendar event'
  },
  detailTypeId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'detail_type_id',
    references: {
      model: 'app_event_detail_type',
      key: 'id'
    },
    comment: 'Type of detail (headache, cramps, etc.)'
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
  tableName: 'app_event_detail',
  timestamps: false,
  indexes: [
    {
      name: 'idx_event_detail_event',
      fields: ['event_id', 'deleted']
    }
  ]
});

module.exports = EventDetail;
