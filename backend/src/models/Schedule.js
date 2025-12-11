const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Schedule Model
 * Represents personal agenda events (appointments, reminders)
 * Table: app_schedule
 */
const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  heading: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'heading',
    comment: 'Event title'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'message',
    comment: 'Event description'
  },
  eventBeginning: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'event_beginning',
    comment: 'Event start date/time'
  },
  eventEnding: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'event_ending',
    comment: 'Event end date/time'
  },
  reminder: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder',
    comment: 'First reminder date'
  },
  reminder2: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_2',
    comment: 'Second reminder date'
  },
  reminder3: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_3',
    comment: 'Third reminder date'
  },
  reminder4: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_4',
    comment: 'Fourth reminder date'
  },
  reminder5: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reminder_5',
    comment: 'Fifth reminder date'
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'color',
    comment: 'Event color CSS class (ui-event-red, ui-event-blue, etc.)'
  },
  googleId: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    field: 'google_id',
    comment: 'Google Calendar event ID for sync'
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'app_user',
      key: 'id'
    },
    comment: 'User who owns this event'
  },
  deleted: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'N',
    field: 'deleted',
    get() {
      const rawValue = this.getDataValue('deleted');
      return rawValue === 'Y';
    },
    set(value) {
      this.setDataValue('deleted', value ? 'Y' : 'N');
    },
    comment: 'Soft delete flag (Y/N)'
  },
  insertionDate: {
    type: DataTypes.DATE,
    allowNull: true,
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
  tableName: 'app_schedule',
  timestamps: false,
  defaultScope: {
    where: sequelize.literal("deleted = 'N'")
  },
  scopes: {
    withDeleted: {}
  },
  indexes: [
    {
      name: 'idx_schedule_user_date',
      fields: ['user_id', 'event_beginning', 'deleted']
    }
  ]
});

// Color constants for frontend
Schedule.COLORS = {
  RED: 'ui-event-red',
  ORANGE: 'ui-event-orange',
  YELLOW: 'ui-event-yellow',
  GREEN: 'ui-event-green',
  AQUAMARINE: 'ui-event-aquamarine',
  TURQUOISE: 'ui-event-turquoise',
  BLUE: 'ui-event-blue',
  PURPLE: 'ui-event-purple',
  LAVANDER: 'ui-event-lavander',      // Esami prenotati
  RED_PURPLE: 'ui-event-red-purple'   // Esami periodici
};

module.exports = Schedule;
