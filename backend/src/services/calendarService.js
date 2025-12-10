const { Op } = require('sequelize');
const { CalendarEvent, EventDetail, EventDetailType, Team, Typology, User } = require('../models');

/**
 * Calendar Event Service
 * Handles menstrual cycle tracking business logic
 */
class CalendarService {

  /**
   * Event type constants (from app_typology)
   */
  static EVENT_TYPES = {
    MENSES: 20,              // Mestruazione/Ciclo
    TEMPERATURE: 21,         // Temperatura basale
    WEIGHT: 22,              // Peso
    SYMPTOMS: 23,            // Sintomi
    DRUGS: 24,               // Farmaci
    MOODS: 25,               // Stati d'animo
    OVULATION: 26,           // Ovulazione (calcolata)
    FERTILITY: 27,           // Periodo fertile (calcolato)
    MENSES_EXPECTATION: 28,  // Ciclo previsto
    PREGNANCY: 29            // Gravidanza
  };

  /**
   * Validate user has required profile data for calendar
   * @param {User} user - User object
   * @returns {Object} { valid: boolean, message: string }
   */
  validateUserPrerequisites(user) {
    if (!user.durationPeriod || user.durationPeriod <= 0) {
      return {
        valid: false,
        message: 'Per utilizzare il calendario mestruale devi valorizzare la durata del ciclo nel tuo profilo'
      };
    }

    if (!user.durationMenstruation || user.durationMenstruation <= 0) {
      return {
        valid: false,
        message: 'Per utilizzare il calendario mestruale devi valorizzare la durata della mestruazione nel tuo profilo'
      };
    }

    return { valid: true };
  }

  /**
   * Get events in date range with calculated events
   * @param {Date} startDate - Range start
   * @param {Date} endDate - Range end
   * @param {number} teamId - Team ID
   * @param {User} user - User object for calculations
   * @returns {Promise<Array>} Array of events
   */
  async getEventsInRange(startDate, endDate, teamId, user) {
    // Fetch persisted events from database
    const persistedEvents = await CalendarEvent.findAll({
      where: {
        teamId,
        deleted: false,
        [Op.or]: [
          {
            // Events that start in range
            beginning: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            // Events that end in range
            ending: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            // Events that span the range
            beginning: {
              [Op.lte]: startDate
            },
            ending: {
              [Op.gte]: endDate
            }
          }
        ]
      },
      include: [
        {
          model: Typology,
          as: 'type',
          where: { deleted: false }
        },
        {
          model: EventDetail,
          as: 'details',
          required: false,
          where: { deleted: false },
          include: [
            {
              model: EventDetailType,
              as: 'detailType',
              where: { deleted: false }
            }
          ]
        }
      ],
      order: [['beginning', 'ASC']]
    });

    // Calculate dynamic events (ovulation, fertility, future cycles)
    const calculatedEvents = await this.calculateDynamicEvents(
      startDate,
      endDate,
      persistedEvents,
      user,
      teamId
    );

    // Combine and return
    return [...persistedEvents, ...calculatedEvents];
  }

  /**
   * Calculate dynamic events (ovulation, fertility, predicted cycles)
   * @param {Date} startDate - Range start
   * @param {Date} endDate - Range end
   * @param {Array} persistedEvents - Existing events
   * @param {User} user - User object
   * @param {number} teamId - Team ID for fetching additional data
   * @returns {Promise<Array>} Calculated events
   */
  async calculateDynamicEvents(startDate, endDate, persistedEvents, user, teamId) {
    const calculated = [];

    // Get all menses events from persisted events in range
    // Note: typeId from DB may be string, so use parseInt for comparison
    let mensesEvents = persistedEvents.filter(
      e => parseInt(e.typeId) === CalendarService.EVENT_TYPES.MENSES && !e.deleted
    );

    // If no menses events in range, fetch the most recent one from DB
    // This ensures predictions work for future months
    if (mensesEvents.length === 0 && teamId) {
      const lastMenses = await this.getLastMensesEvent(teamId);
      if (lastMenses) {
        mensesEvents = [lastMenses];
      }
    }

    if (mensesEvents.length === 0) {
      return calculated; // No data to calculate from
    }

    // Sort by date descending to get most recent first
    mensesEvents.sort((a, b) => new Date(b.beginning) - new Date(a.beginning));

    // For each menses event, calculate ovulation and fertility
    for (let i = 0; i < mensesEvents.length; i++) {
      const currentMenses = mensesEvents[i];
      const nextMenses = i > 0 ? mensesEvents[i - 1] : null;

      const { ovulation, fertility } = this.calculateOvulationAndFertility(
        currentMenses,
        nextMenses,
        user.durationPeriod
      );

      if (ovulation) calculated.push(ovulation);
      if (fertility) calculated.push(fertility);
    }

    // Calculate future predicted cycles
    const lastMenses = mensesEvents[0]; // Most recent
    const predictedCycles = this.predictFutureCycles(
      new Date(lastMenses.beginning),
      endDate,
      user.durationPeriod,
      user.durationMenstruation
    );

    calculated.push(...predictedCycles);

    // Filter calculated events to only those in range
    return calculated.filter(event => {
      const eventStart = new Date(event.beginning);
      const eventEnd = new Date(event.ending || event.beginning);
      return (eventStart >= startDate && eventStart <= endDate) ||
             (eventEnd >= startDate && eventEnd <= endDate) ||
             (eventStart <= startDate && eventEnd >= endDate);
    });
  }

  /**
   * Calculate ovulation and fertility for a cycle
   * @param {Object} currentMenses - Current menses event
   * @param {Object} nextMenses - Next (future) menses event
   * @param {number} durationPeriod - Cycle duration
   * @returns {Object} { ovulation, fertility }
   */
  calculateOvulationAndFertility(currentMenses, nextMenses, durationPeriod) {
    const currentMensesDate = new Date(currentMenses.beginning);

    // Calculate ovulation date
    // Typically 14 days before next period, or (durationPeriod / 2) from current
    let ovulationDate;

    if (nextMenses) {
      // If we know the next period, ovulation is 14 days before
      ovulationDate = new Date(nextMenses.beginning);
      ovulationDate.setDate(ovulationDate.getDate() - 14);
    } else {
      // Otherwise estimate from current + half cycle (cap at 14 days)
      const intervalForOvulation = Math.min(Math.floor(durationPeriod / 2), 14);
      ovulationDate = new Date(currentMensesDate);
      ovulationDate.setDate(ovulationDate.getDate() + intervalForOvulation);
    }

    // Ovulation event (single day)
    const ovulation = {
      id: `calculated-ovulation-${currentMenses.id}`,
      beginning: ovulationDate,
      ending: ovulationDate,
      typeId: CalendarService.EVENT_TYPES.OVULATION,
      teamId: currentMenses.teamId,
      calculated: true,
      type: {
        id: CalendarService.EVENT_TYPES.OVULATION,
        label: 'Ovulazione',
        pertinence: 'calendar_event'
      }
    };

    // Fertility window: 4 days before ovulation + 3 days after
    const prevMensesEnd = currentMenses.ending ? new Date(currentMenses.ending) : null;

    let fertilityStart = new Date(ovulationDate);
    fertilityStart.setDate(fertilityStart.getDate() - 4);

    // Don't let fertility start before previous menses ended
    if (prevMensesEnd && fertilityStart < prevMensesEnd) {
      fertilityStart = new Date(prevMensesEnd);
      fertilityStart.setDate(fertilityStart.getDate() + 1);
    }

    const fertilityEnd = new Date(ovulationDate);
    fertilityEnd.setDate(fertilityEnd.getDate() + 3);

    const fertility = {
      id: `calculated-fertility-${currentMenses.id}`,
      beginning: fertilityStart,
      ending: fertilityEnd,
      typeId: CalendarService.EVENT_TYPES.FERTILITY,
      teamId: currentMenses.teamId,
      calculated: true,
      type: {
        id: CalendarService.EVENT_TYPES.FERTILITY,
        label: 'Periodo fertile',
        pertinence: 'calendar_event'
      }
    };

    return { ovulation, fertility };
  }

  /**
   * Predict future menstrual cycles
   * @param {Date} lastMensesDate - Date of last period
   * @param {Date} endDate - Range end
   * @param {number} durationPeriod - Cycle duration
   * @param {number} durationMenstruation - Menstruation duration
   * @returns {Array} Predicted cycle events
   */
  predictFutureCycles(lastMensesDate, endDate, durationPeriod, durationMenstruation) {
    const predictions = [];
    let nextCycleDate = new Date(lastMensesDate);
    nextCycleDate.setDate(nextCycleDate.getDate() + durationPeriod);

    let counter = 0;
    while (nextCycleDate <= endDate && counter < 12) { // Max 12 cycles ahead
      const cycleEnd = new Date(nextCycleDate);
      cycleEnd.setDate(cycleEnd.getDate() + durationMenstruation - 1);

      predictions.push({
        id: `predicted-cycle-${counter}`,
        beginning: new Date(nextCycleDate),
        ending: cycleEnd,
        typeId: CalendarService.EVENT_TYPES.MENSES_EXPECTATION,
        calculated: true,
        type: {
          id: CalendarService.EVENT_TYPES.MENSES_EXPECTATION,
          label: 'Ciclo previsto',
          pertinence: 'calendar_event'
        }
      });

      // Also calculate ovulation and fertility for predicted cycle
      const { ovulation, fertility } = this.calculateOvulationAndFertility(
        {
          id: `predicted-${counter}`,
          beginning: nextCycleDate,
          ending: cycleEnd,
          teamId: null
        },
        null,
        durationPeriod
      );

      ovulation.id = `predicted-ovulation-${counter}`;
      fertility.id = `predicted-fertility-${counter}`;

      predictions.push(ovulation, fertility);

      nextCycleDate.setDate(nextCycleDate.getDate() + durationPeriod);
      counter++;
    }

    return predictions;
  }

  /**
   * Get last menses date for a team
   * @param {number} teamId - Team ID
   * @returns {Promise<Date|null>} Last menses date
   */
  async getLastMensesDate(teamId) {
    const lastMenses = await CalendarEvent.findOne({
      where: {
        teamId,
        typeId: CalendarService.EVENT_TYPES.MENSES,
        deleted: false
      },
      order: [['beginning', 'DESC']],
      attributes: ['beginning']
    });

    return lastMenses ? new Date(lastMenses.beginning) : null;
  }

  /**
   * Check if there's an open menses period
   * @param {number} teamId - Team ID
   * @returns {Promise<Object|null>} Open menses event or null
   */
  async getOpenMensesPeriod(teamId) {
    // An open period is one without an ending date
    return await CalendarEvent.findOne({
      where: {
        teamId,
        typeId: CalendarService.EVENT_TYPES.MENSES,
        ending: null,
        deleted: false
      },
      order: [['beginning', 'DESC']]
    });
  }

  /**
   * Create calendar event
   * @param {Object} eventData - Event data
   * @param {Object} options - Transaction options
   * @returns {Promise<CalendarEvent>}
   */
  async createEvent(eventData, options = {}) {
    const { transaction } = options;

    return await CalendarEvent.create({
      beginning: eventData.beginning,
      ending: eventData.ending || null,
      value: eventData.value || null,
      typeId: eventData.typeId,
      teamId: eventData.teamId,
      deleted: false,
      insertionDate: new Date(),
      lastModifyDate: new Date(),
      lastModifyUsername: eventData.username || null
    }, { transaction });
  }

  /**
   * Update calendar event
   * @param {number} eventId - Event ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Transaction options
   * @returns {Promise<CalendarEvent>}
   */
  async updateEvent(eventId, updateData, options = {}) {
    const { transaction } = options;

    const event = await CalendarEvent.findByPk(eventId, { transaction });
    if (!event) {
      throw new Error('Evento non trovato');
    }

    await event.update({
      ...updateData,
      lastModifyDate: new Date(),
      lastModifyUsername: updateData.username || null
    }, { transaction });

    return event;
  }

  /**
   * Soft delete calendar event
   * @param {number} eventId - Event ID
   * @param {Object} options - Transaction options
   * @returns {Promise<boolean>}
   */
  async deleteEvent(eventId, options = {}) {
    const { transaction } = options;

    const event = await CalendarEvent.findByPk(eventId, { transaction });
    if (!event) {
      throw new Error('Evento non trovato');
    }

    await event.update({
      deleted: true,
      lastModifyDate: new Date()
    }, { transaction });

    return true;
  }

  /**
   * Get event detail types for an event type
   * @param {number} eventTypeId - Event type ID (23=symptoms, 24=drugs, 25=moods)
   * @returns {Promise<Array>} Array of detail types
   */
  async getEventDetailTypes(eventTypeId) {
    return await EventDetailType.findAll({
      where: {
        eventTypeId,
        deleted: false
      },
      include: [
        {
          model: Typology,
          as: 'eventType',
          where: { deleted: false }
        }
      ],
      order: [['label', 'ASC']]
    });
  }

  /**
   * Save event details (symptoms, drugs, moods)
   * @param {number} eventId - Parent event ID
   * @param {Array} details - Array of { detailTypeId, value, selected }
   * @param {Object} options - Transaction options
   * @returns {Promise<Array>}
   */
  async saveEventDetails(eventId, details, options = {}) {
    const { transaction } = options;

    const savedDetails = [];

    for (const detail of details) {
      if (detail.selected) {
        // Create or update detail
        const [eventDetail, created] = await EventDetail.findOrCreate({
          where: {
            eventId,
            detailTypeId: detail.detailTypeId,
            deleted: false
          },
          defaults: {
            value: detail.value || null,
            deleted: false,
            insertionDate: new Date()
          },
          transaction
        });

        if (!created) {
          // Update existing
          await eventDetail.update({
            value: detail.value || null,
            lastModifyDate: new Date()
          }, { transaction });
        }

        savedDetails.push(eventDetail);
      } else {
        // Soft delete if exists and selected = false
        await EventDetail.update({
          deleted: true,
          lastModifyDate: new Date()
        }, {
          where: {
            eventId,
            detailTypeId: detail.detailTypeId
          },
          transaction
        });
      }
    }

    return savedDetails;
  }

  /**
   * Get last menses event (full event object)
   * @param {number} teamId - Team ID
   * @returns {Promise<CalendarEvent|null>}
   */
  async getLastMensesEvent(teamId) {
    return await CalendarEvent.findOne({
      where: {
        teamId,
        typeId: CalendarService.EVENT_TYPES.MENSES,
        deleted: false
      },
      order: [['beginning', 'DESC']]
    });
  }

  /**
   * Get active pregnancy event for a team
   * @param {number} teamId - Team ID
   * @returns {Promise<CalendarEvent|null>}
   */
  async getActivePregnancy(teamId) {
    return await CalendarEvent.findOne({
      where: {
        teamId,
        typeId: CalendarService.EVENT_TYPES.PREGNANCY,
        deleted: false
      },
      order: [['beginning', 'DESC']]
    });
  }

  /**
   * Terminate pregnancy when new period starts
   * @param {number} teamId - Team ID
   * @param {Date} endDate - Date to set as pregnancy end
   * @param {Object} options - Transaction options
   * @returns {Promise<boolean>}
   */
  async terminatePregnancy(teamId, endDate, options = {}) {
    const { transaction } = options;

    const pregnancyEvent = await this.getActivePregnancy(teamId);
    if (!pregnancyEvent) {
      return false;
    }

    // Set the pregnancy event as deleted and update ending date
    await pregnancyEvent.update({
      ending: new Date(endDate),
      deleted: true,
      lastModifyDate: new Date()
    }, { transaction });

    // Also clear the user's pregnancy-related fields if needed
    // This would require accessing User model and team's representative
    // For now, we just mark the event as deleted

    return true;
  }
}

module.exports = new CalendarService();
