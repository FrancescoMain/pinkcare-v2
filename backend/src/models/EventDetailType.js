const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EventDetailType Model
 * Represents types of event details (symptom types, drug types, mood types)
 * Table: app_event_detail_type
 */
const EventDetailType = sequelize.define('EventDetailType', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'label',
    comment: 'Display name (e.g., "Cefalea", "Crampi", "Tristezza")'
  },
  eventTypeId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'event_type_id',
    references: {
      model: 'app_typology',
      key: 'id'
    },
    comment: 'Parent event type: SYMPTOMS(23), DRUGS(24), MOODS(25)'
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
  }
}, {
  tableName: 'app_event_detail_type',
  timestamps: false,
  indexes: [
    {
      name: 'idx_event_detail_type_parent',
      fields: ['event_type_id', 'deleted']
    }
  ]
});

module.exports = EventDetailType;
