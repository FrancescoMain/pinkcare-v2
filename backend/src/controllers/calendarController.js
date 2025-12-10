const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const calendarService = require('../services/calendarService');
const userService = require('../services/userService');

/**
 * Calendar Controller
 * Handles menstrual calendar HTTP requests
 */
class CalendarController {

  /**
   * Get events in date range
   * GET /api/calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD
   */
  async getEvents(req, res, next) {
    try {
      const { start, end } = req.query;
      const userId = req.user.userId; // From JWT middleware

      if (!start || !end) {
        return res.status(400).json({
          error: 'Parametri start e end sono obbligatori'
        });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({
          error: 'Formato date non valido. Usa YYYY-MM-DD'
        });
      }

      // Get user with profile data
      const user = await userService.getUserProfile(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Utente non trovato'
        });
      }

      // Validate prerequisites
      const validation = calendarService.validateUserPrerequisites(user);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.message,
          requiresProfileUpdate: true
        });
      }

      // Get active teams for user
      const teams = user.teams?.filter(t => !t.removed);
      if (!teams || teams.length === 0) {
        return res.status(400).json({
          error: 'Utente non associato a nessun team'
        });
      }

      const teamId = teams[0].id; // Use first team

      // Get events in range
      const events = await calendarService.getEventsInRange(
        startDate,
        endDate,
        teamId,
        user
      );

      // Format response
      const formattedEvents = events.map(event => ({
        id: event.id,
        beginning: event.beginning,
        ending: event.ending,
        value: event.value,
        typeId: event.typeId,
        teamId: event.teamId,
        calculated: event.calculated || false,
        type: {
          id: event.type?.id || event.typeId,
          label: event.type?.label || '',
          pertinence: event.type?.pertinence || 'calendar_event'
        },
        details: event.details?.map(d => ({
          id: d.id,
          value: d.value,
          detailType: {
            id: d.detailType?.id,
            label: d.detailType?.label
          }
        })) || []
      }));

      res.json({
        events: formattedEvents,
        userProfile: {
          durationPeriod: user.durationPeriod,
          durationMenstruation: user.durationMenstruation,
          regularityMenstruation: user.regularityMenstruation,
          ageFirstMenstruation: user.ageFirstMenstruation
        }
      });

    } catch (error) {
      console.error('Get events error:', error);
      next(error);
    }
  }

  /**
   * Create calendar event
   * POST /api/calendar/events
   */
  async createEvent(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const userId = req.user.userId;
      const { typeId, beginning, ending, value, details } = req.body;

      // Get user and team
      const user = await userService.getUserProfile(userId);
      const teams = user.teams?.filter(t => !t.removed);
      if (!teams || teams.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Utente non associato a nessun team'
        });
      }
      const teamId = teams[0].id;

      // Validate menses period logic
      if (typeId === calendarService.constructor.EVENT_TYPES.MENSES) {
        const openPeriod = await calendarService.getOpenMensesPeriod(teamId);
        if (openPeriod && !ending) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Hai già un ciclo aperto. Chiudilo prima di iniziarne uno nuovo'
          });
        }
      }

      // Create event
      const event = await calendarService.createEvent({
        beginning: new Date(beginning),
        ending: ending ? new Date(ending) : null,
        value: value || null,
        typeId,
        teamId,
        username: user.email
      }, { transaction });

      // Save details if provided (for symptoms, drugs, moods)
      if (details && details.length > 0) {
        await calendarService.saveEventDetails(event.id, details, { transaction });
      }

      await transaction.commit();

      // Reload with associations
      const createdEvent = await calendarService.constructor.prototype.constructor.findByPk
        ? await calendarService.getEventsInRange(
            new Date(beginning),
            ending ? new Date(ending) : new Date(beginning),
            teamId,
            user
          )
        : null;

      res.status(201).json({
        message: 'Evento creato con successo',
        event: {
          id: event.id,
          beginning: event.beginning,
          ending: event.ending,
          value: event.value,
          typeId: event.typeId
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Create event error:', error);
      next(error);
    }
  }

  /**
   * Update calendar event
   * PUT /api/calendar/events/:id
   */
  async updateEvent(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const { beginning, ending, value, details } = req.body;

      const user = await userService.getUserProfile(userId);

      // Update event
      const event = await calendarService.updateEvent(
        parseInt(id),
        {
          beginning: beginning ? new Date(beginning) : undefined,
          ending: ending ? new Date(ending) : undefined,
          value: value !== undefined ? value : undefined,
          username: user.email
        },
        { transaction }
      );

      // Update details if provided
      if (details && details.length > 0) {
        await calendarService.saveEventDetails(event.id, details, { transaction });
      }

      await transaction.commit();

      res.json({
        message: 'Evento aggiornato con successo',
        event: {
          id: event.id,
          beginning: event.beginning,
          ending: event.ending,
          value: event.value
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Update event error:', error);

      if (error.message.includes('non trovato')) {
        return res.status(404).json({ error: error.message });
      }

      next(error);
    }
  }

  /**
   * Delete calendar event
   * DELETE /api/calendar/events/:id
   */
  async deleteEvent(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      await calendarService.deleteEvent(parseInt(id), { transaction });

      await transaction.commit();

      res.json({
        message: 'Evento cancellato con successo'
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Delete event error:', error);

      if (error.message.includes('non trovato')) {
        return res.status(404).json({ error: error.message });
      }

      next(error);
    }
  }

  /**
   * Get event detail types for an event type
   * GET /api/calendar/event-detail-types?eventType=23
   */
  async getEventDetailTypes(req, res, next) {
    try {
      const { eventType } = req.query;

      if (!eventType) {
        return res.status(400).json({
          error: 'Parametro eventType obbligatorio (23=symptoms, 24=drugs, 25=moods)'
        });
      }

      const eventTypeId = parseInt(eventType);

      if (![23, 24, 25].includes(eventTypeId)) {
        return res.status(400).json({
          error: 'eventType deve essere 23 (symptoms), 24 (drugs) o 25 (moods)'
        });
      }

      const detailTypes = await calendarService.getEventDetailTypes(eventTypeId);

      res.json({
        detailTypes: detailTypes.map(dt => ({
          id: dt.id,
          label: dt.label,
          eventTypeId: dt.eventTypeId
        }))
      });

    } catch (error) {
      console.error('Get detail types error:', error);
      next(error);
    }
  }

  /**
   * Get last menses date
   * GET /api/calendar/last-menses
   */
  async getLastMenses(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await userService.getUserProfile(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }

      const teams = user.teams?.filter(t => !t.removed);
      if (!teams || teams.length === 0) {
        return res.status(400).json({ error: 'Utente non associato a nessun team' });
      }
      const teamId = teams[0].id;

      const lastMensesDate = await calendarService.getLastMensesDate(teamId);
      const openPeriod = await calendarService.getOpenMensesPeriod(teamId);

      res.json({
        lastMensesDate,
        hasOpenPeriod: !!openPeriod,
        openPeriodId: openPeriod?.id || null
      });

    } catch (error) {
      console.error('Get last menses error:', error);
      next(error);
    }
  }

  /**
   * Start a new menstrual period
   * POST /api/calendar/start-period
   */
  async startPeriod(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const userId = req.user.userId;
      const { date } = req.body;

      const user = await userService.getUserProfile(userId);
      const teams = user.teams?.filter(t => !t.removed);
      if (!teams || teams.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Utente non associato a nessun team' });
      }
      const teamId = teams[0].id;

      // Check for open period
      const openPeriod = await calendarService.getOpenMensesPeriod(teamId);
      if (openPeriod) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Hai già un ciclo aperto. Chiudilo prima di iniziarne uno nuovo',
          openPeriodId: openPeriod.id
        });
      }

      // Calculate ending date based on user's duration_menstruation
      const beginningDate = new Date(date);
      let endingDate = null;
      if (user.durationMenstruation && user.durationMenstruation > 0) {
        endingDate = new Date(beginningDate);
        endingDate.setDate(endingDate.getDate() + user.durationMenstruation - 1);
      }

      // Create the menses event
      const event = await calendarService.createEvent({
        beginning: beginningDate,
        ending: endingDate,
        typeId: calendarService.constructor.EVENT_TYPES.MENSES,
        teamId,
        username: user.email
      }, { transaction });

      // Check and terminate any pregnancy event
      const pregnancyEvent = await calendarService.getActivePregnancy(teamId);
      if (pregnancyEvent) {
        await calendarService.terminatePregnancy(teamId, beginningDate, { transaction });
      }

      await transaction.commit();

      res.status(201).json({
        message: 'Ciclo iniziato con successo',
        event: {
          id: event.id,
          beginning: event.beginning,
          ending: event.ending
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Start period error:', error);
      next(error);
    }
  }

  /**
   * End current menstrual period
   * POST /api/calendar/end-period
   */
  async endPeriod(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const userId = req.user.userId;
      const { date } = req.body;

      const user = await userService.getUserProfile(userId);
      const teams = user.teams?.filter(t => !t.removed);
      if (!teams || teams.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Utente non associato a nessun team' });
      }
      const teamId = teams[0].id;

      // Get the open period
      const openPeriod = await calendarService.getOpenMensesPeriod(teamId);
      if (!openPeriod) {
        // No open period - try to find the most recent one to update
        const lastMenses = await calendarService.getLastMensesEvent(teamId);
        if (!lastMenses) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Nessun ciclo trovato da chiudere'
          });
        }

        // Update the last menses event's ending
        await calendarService.updateEvent(lastMenses.id, {
          ending: new Date(date),
          username: user.email
        }, { transaction });

        await transaction.commit();

        return res.json({
          message: 'Ciclo aggiornato con successo',
          event: {
            id: lastMenses.id,
            ending: new Date(date)
          }
        });
      }

      // Update the open period's ending date
      await calendarService.updateEvent(openPeriod.id, {
        ending: new Date(date),
        username: user.email
      }, { transaction });

      await transaction.commit();

      res.json({
        message: 'Ciclo chiuso con successo',
        event: {
          id: openPeriod.id,
          beginning: openPeriod.beginning,
          ending: new Date(date)
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('End period error:', error);
      next(error);
    }
  }
}

module.exports = new CalendarController();
