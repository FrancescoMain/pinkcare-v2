const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Schedule, RecommendedExamination, User, Team, ExaminationPathology } = require('../models');

/**
 * Schedule Service
 * Handles personal agenda (calendar) business logic
 */
class ScheduleService {

  /**
   * Event color constants
   */
  static COLORS = {
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

  /**
   * Get all events (schedules + examinations) in date range
   * @param {Date} startDate - Range start
   * @param {Date} endDate - Range end
   * @param {number} userId - User ID
   * @param {number} teamId - Team ID (for examinations)
   * @returns {Promise<Array>} Array of events
   */
  async getEventsInRange(startDate, endDate, userId, teamId) {
    const events = [];

    // Fetch personal schedule events - use unscoped() and literal() to avoid CHAR/boolean type mismatch
    const schedules = await Schedule.unscoped().findAll({
      where: {
        userId,
        [Op.and]: [
          sequelize.literal("deleted = 'N'"),
          {
            [Op.or]: [
              {
                eventBeginning: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                eventEnding: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                eventBeginning: {
                  [Op.lte]: startDate
                },
                eventEnding: {
                  [Op.gte]: endDate
                }
              }
            ]
          }
        ]
      },
      order: [['eventBeginning', 'ASC']]
    });

    // Transform schedule events
    for (const schedule of schedules) {
      events.push({
        id: schedule.id,
        type: 'schedule',
        title: schedule.heading,
        description: schedule.message,
        start: schedule.eventBeginning,
        end: schedule.eventEnding,
        color: schedule.color || ScheduleService.COLORS.BLUE,
        reminder: schedule.reminder,
        allDay: this._isAllDayEvent(schedule.eventBeginning, schedule.eventEnding),
        editable: true
      });
    }

    // Fetch recommended examinations (if teamId provided)
    if (teamId) {
      const examinations = await RecommendedExamination.findAll({
        where: {
          teamId,
          // defaultScope handles deleted='N'
          controlDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: ExaminationPathology,
            as: 'examination',
            attributes: ['id', 'label']
          }
        ],
        order: [['controlDate', 'ASC']]
      });

      // Transform examination events
      for (const exam of examinations) {
        events.push({
          id: -exam.id, // Negative ID to distinguish from schedules
          type: 'examination',
          title: exam.examination?.label || 'Esame',
          description: exam.note,
          start: exam.controlDate,
          end: exam.controlDate,
          color: exam.periodicalControl
            ? ScheduleService.COLORS.RED_PURPLE
            : ScheduleService.COLORS.LAVANDER,
          confirmed: exam.confirmed,
          periodicalControl: exam.periodicalControl,
          allDay: true,
          editable: false // Examinations are managed elsewhere
        });
      }
    }

    // Sort all events by start date
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    return events;
  }

  /**
   * Get upcoming events for the next N days
   * @param {number} userId - User ID
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Array of upcoming events
   */
  async getNextEvents(userId, teamId, days = 30) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);

    return this.getEventsInRange(startDate, endDate, userId, teamId);
  }

  /**
   * Create a new schedule event
   * @param {Object} eventData - Event data
   * @param {number} userId - User ID
   * @returns {Promise<Schedule>} Created schedule
   */
  async createEvent(eventData, userId) {
    const now = new Date();
    const color = eventData.color || ScheduleService.COLORS.BLUE;

    // Use raw SQL with nextval to handle PostgreSQL sequence for id
    const [result] = await sequelize.query(`
      INSERT INTO app_schedule (
        id, heading, message, event_beginning, event_ending,
        reminder, reminder_2, reminder_3, reminder_4, reminder_5,
        color, user_id, deleted, insertion_date, last_modify_date
      ) VALUES (
        nextval('app_schedule_id_seq'),
        :heading, :message, :eventBeginning, :eventEnding,
        :reminder, :reminder2, :reminder3, :reminder4, :reminder5,
        :color, :userId, 'N', :insertionDate, :lastModifyDate
      ) RETURNING *
    `, {
      replacements: {
        heading: eventData.heading || null,
        message: eventData.message || null,
        eventBeginning: eventData.eventBeginning || null,
        eventEnding: eventData.eventEnding || null,
        reminder: eventData.reminder || null,
        reminder2: eventData.reminder2 || null,
        reminder3: eventData.reminder3 || null,
        reminder4: eventData.reminder4 || null,
        reminder5: eventData.reminder5 || null,
        color,
        userId,
        insertionDate: now,
        lastModifyDate: now
      },
      type: sequelize.QueryTypes.INSERT
    });

    const schedule = result[0];

    return {
      id: schedule.id,
      type: 'schedule',
      title: schedule.heading,
      heading: schedule.heading,
      description: schedule.message,
      message: schedule.message,
      start: schedule.event_beginning,
      end: schedule.event_ending,
      eventBeginning: schedule.event_beginning,
      eventEnding: schedule.event_ending,
      color: schedule.color || ScheduleService.COLORS.BLUE,
      reminder: schedule.reminder,
      reminder2: schedule.reminder_2,
      reminder3: schedule.reminder_3,
      reminder4: schedule.reminder_4,
      reminder5: schedule.reminder_5,
      allDay: this._isAllDayEvent(schedule.event_beginning, schedule.event_ending),
      editable: true
    };
  }

  /**
   * Update an existing schedule event
   * @param {number} id - Schedule ID
   * @param {Object} eventData - Updated event data
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Schedule>} Updated schedule
   */
  async updateEvent(id, eventData, userId) {
    const schedule = await Schedule.unscoped().findOne({
      where: {
        id,
        userId,
        [Op.and]: [sequelize.literal("deleted = 'N'")]
      }
    });

    if (!schedule) {
      throw new Error('Evento non trovato');
    }

    await schedule.update({
      heading: eventData.heading !== undefined ? eventData.heading : schedule.heading,
      message: eventData.message !== undefined ? eventData.message : schedule.message,
      eventBeginning: eventData.eventBeginning !== undefined ? eventData.eventBeginning : schedule.eventBeginning,
      eventEnding: eventData.eventEnding !== undefined ? eventData.eventEnding : schedule.eventEnding,
      reminder: eventData.reminder !== undefined ? eventData.reminder : schedule.reminder,
      reminder2: eventData.reminder2 !== undefined ? eventData.reminder2 : schedule.reminder2,
      reminder3: eventData.reminder3 !== undefined ? eventData.reminder3 : schedule.reminder3,
      reminder4: eventData.reminder4 !== undefined ? eventData.reminder4 : schedule.reminder4,
      reminder5: eventData.reminder5 !== undefined ? eventData.reminder5 : schedule.reminder5,
      color: eventData.color !== undefined ? eventData.color : schedule.color,
      lastModifyDate: new Date()
    });

    return this._transformSchedule(schedule);
  }

  /**
   * Move an event (drag & drop)
   * @param {number} id - Schedule ID
   * @param {Date} newStart - New start date
   * @param {Date} newEnd - New end date
   * @param {number} userId - User ID
   * @returns {Promise<Schedule>} Updated schedule
   */
  async moveEvent(id, newStart, newEnd, userId) {
    const schedule = await Schedule.unscoped().findOne({
      where: {
        id,
        userId,
        [Op.and]: [sequelize.literal("deleted = 'N'")]
      }
    });

    if (!schedule) {
      throw new Error('Evento non trovato');
    }

    await schedule.update({
      eventBeginning: newStart,
      eventEnding: newEnd,
      lastModifyDate: new Date()
    });

    return this._transformSchedule(schedule);
  }

  /**
   * Resize an event (drag resize)
   * @param {number} id - Schedule ID
   * @param {Date} newEnd - New end date
   * @param {number} userId - User ID
   * @returns {Promise<Schedule>} Updated schedule
   */
  async resizeEvent(id, newEnd, userId) {
    const schedule = await Schedule.unscoped().findOne({
      where: {
        id,
        userId,
        [Op.and]: [sequelize.literal("deleted = 'N'")]
      }
    });

    if (!schedule) {
      throw new Error('Evento non trovato');
    }

    await schedule.update({
      eventEnding: newEnd,
      lastModifyDate: new Date()
    });

    return this._transformSchedule(schedule);
  }

  /**
   * Delete a schedule event (soft delete)
   * @param {number} id - Schedule ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success
   */
  async deleteEvent(id, userId) {
    const schedule = await Schedule.unscoped().findOne({
      where: {
        id,
        userId,
        [Op.and]: [sequelize.literal("deleted = 'N'")]
      }
    });

    if (!schedule) {
      throw new Error('Evento non trovato');
    }

    await schedule.update({
      deleted: true,
      lastModifyDate: new Date()
    });

    return true;
  }

  /**
   * Get a single schedule event by ID
   * @param {number} id - Schedule ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Event data
   */
  async getEvent(id, userId) {
    const schedule = await Schedule.unscoped().findOne({
      where: {
        id,
        userId,
        [Op.and]: [sequelize.literal("deleted = 'N'")]
      }
    });

    if (!schedule) {
      throw new Error('Evento non trovato');
    }

    return this._transformSchedule(schedule);
  }

  /**
   * Get available colors
   * @returns {Array} Array of color options
   */
  getColors() {
    return [
      { id: 'ui-event-red', label: 'Rosso', hex: '#E12417' },
      { id: 'ui-event-orange', label: 'Arancione', hex: '#E18A17' },
      { id: 'ui-event-yellow', label: 'Giallo', hex: '#E1D817' },
      { id: 'ui-event-green', label: 'Verde', hex: '#21CD24' },
      { id: 'ui-event-aquamarine', label: 'Acquamarina', hex: '#17E19E' },
      { id: 'ui-event-turquoise', label: 'Turchese', hex: '#17D7E1' },
      { id: 'ui-event-blue', label: 'Blu', hex: '#176FE1' },
      { id: 'ui-event-purple', label: 'Viola', hex: '#E117D4' }
    ];
  }

  /**
   * Check if event is all-day
   * @private
   */
  _isAllDayEvent(start, end) {
    if (!start || !end) return true;

    const startDate = new Date(start);
    const endDate = new Date(end);

    // All day if times are 00:00 and 23:59
    const isStartMidnight = startDate.getHours() === 0 && startDate.getMinutes() === 0;
    const isEndMidnight = endDate.getHours() === 23 && endDate.getMinutes() === 59;

    return isStartMidnight && isEndMidnight;
  }

  /**
   * Transform Schedule model to API response
   * @private
   */
  _transformSchedule(schedule) {
    return {
      id: schedule.id,
      type: 'schedule',
      title: schedule.heading,
      heading: schedule.heading,
      description: schedule.message,
      message: schedule.message,
      start: schedule.eventBeginning,
      end: schedule.eventEnding,
      eventBeginning: schedule.eventBeginning,
      eventEnding: schedule.eventEnding,
      color: schedule.color || ScheduleService.COLORS.BLUE,
      reminder: schedule.reminder,
      reminder2: schedule.reminder2,
      reminder3: schedule.reminder3,
      reminder4: schedule.reminder4,
      reminder5: schedule.reminder5,
      allDay: this._isAllDayEvent(schedule.eventBeginning, schedule.eventEnding),
      editable: true
    };
  }
}

module.exports = new ScheduleService();
