const scheduleService = require('../services/scheduleService');
const { User, Team, UserTeam } = require('../models');

/**
 * Schedule Controller
 * Handles personal agenda API endpoints
 */
class ScheduleController {

  /**
   * Get events in date range
   * GET /api/schedule/events?start=YYYY-MM-DD&end=YYYY-MM-DD
   */
  async getEvents(req, res) {
    try {
      const { start, end } = req.query;
      const userId = req.user.id;

      if (!start || !end) {
        return res.status(400).json({
          error: 'Parametri start e end obbligatori'
        });
      }

      // Parse dates
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      // Get user's team
      const userTeam = await UserTeam.findOne({
        where: { app_user_id: userId }
      });
      const teamId = userTeam?.teams_id;

      const events = await scheduleService.getEventsInRange(startDate, endDate, userId, teamId);

      return res.json({ events });
    } catch (error) {
      console.error('[ScheduleController] getEvents error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli eventi'
      });
    }
  }

  /**
   * Get upcoming events for next N days
   * GET /api/schedule/upcoming?days=30
   */
  async getUpcomingEvents(req, res) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 30;

      // Get user's team
      const userTeam = await UserTeam.findOne({
        where: { app_user_id: userId }
      });
      const teamId = userTeam?.teams_id;

      const events = await scheduleService.getNextEvents(userId, teamId, days);

      return res.json({ events });
    } catch (error) {
      console.error('[ScheduleController] getUpcomingEvents error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli eventi'
      });
    }
  }

  /**
   * Get a single event
   * GET /api/schedule/events/:id
   */
  async getEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const event = await scheduleService.getEvent(parseInt(id), userId);

      return res.json({ event });
    } catch (error) {
      console.error('[ScheduleController] getEvent error:', error);

      if (error.message === 'Evento non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel caricamento dell\'evento'
      });
    }
  }

  /**
   * Create a new event
   * POST /api/schedule/events
   */
  async createEvent(req, res) {
    try {
      const userId = req.user.id;
      const eventData = req.body;

      // Validate required fields
      if (!eventData.heading) {
        return res.status(400).json({
          error: 'Il titolo è obbligatorio'
        });
      }

      if (!eventData.eventBeginning) {
        return res.status(400).json({
          error: 'La data di inizio è obbligatoria'
        });
      }

      // Default end to beginning if not provided
      if (!eventData.eventEnding) {
        eventData.eventEnding = eventData.eventBeginning;
      }

      // Validate dates
      const beginning = new Date(eventData.eventBeginning);
      const ending = new Date(eventData.eventEnding);

      if (beginning > ending) {
        return res.status(400).json({
          error: 'La data di inizio non può essere successiva alla data di fine'
        });
      }

      // Validate reminder if provided
      if (eventData.reminder) {
        const reminder = new Date(eventData.reminder);
        if (reminder > beginning) {
          return res.status(400).json({
            error: 'Il promemoria non può essere successivo all\'inizio dell\'evento'
          });
        }
      }

      const event = await scheduleService.createEvent(eventData, userId);

      return res.status(201).json({
        message: 'Evento creato con successo',
        event
      });
    } catch (error) {
      console.error('[ScheduleController] createEvent error:', error);
      return res.status(500).json({
        error: 'Errore nella creazione dell\'evento'
      });
    }
  }

  /**
   * Update an existing event
   * PUT /api/schedule/events/:id
   */
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const eventData = req.body;

      // Validate dates if both provided
      if (eventData.eventBeginning && eventData.eventEnding) {
        const beginning = new Date(eventData.eventBeginning);
        const ending = new Date(eventData.eventEnding);

        if (beginning > ending) {
          return res.status(400).json({
            error: 'La data di inizio non può essere successiva alla data di fine'
          });
        }
      }

      const event = await scheduleService.updateEvent(parseInt(id), eventData, userId);

      return res.json({
        message: 'Evento aggiornato con successo',
        event
      });
    } catch (error) {
      console.error('[ScheduleController] updateEvent error:', error);

      if (error.message === 'Evento non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'aggiornamento dell\'evento'
      });
    }
  }

  /**
   * Move an event (drag & drop)
   * PATCH /api/schedule/events/:id/move
   */
  async moveEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { start, end } = req.body;

      if (!start || !end) {
        return res.status(400).json({
          error: 'Le nuove date sono obbligatorie'
        });
      }

      const event = await scheduleService.moveEvent(
        parseInt(id),
        new Date(start),
        new Date(end),
        userId
      );

      return res.json({
        message: 'Evento spostato con successo',
        event
      });
    } catch (error) {
      console.error('[ScheduleController] moveEvent error:', error);

      if (error.message === 'Evento non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nello spostamento dell\'evento'
      });
    }
  }

  /**
   * Resize an event (drag resize)
   * PATCH /api/schedule/events/:id/resize
   */
  async resizeEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { end } = req.body;

      if (!end) {
        return res.status(400).json({
          error: 'La nuova data di fine è obbligatoria'
        });
      }

      const event = await scheduleService.resizeEvent(
        parseInt(id),
        new Date(end),
        userId
      );

      return res.json({
        message: 'Evento ridimensionato con successo',
        event
      });
    } catch (error) {
      console.error('[ScheduleController] resizeEvent error:', error);

      if (error.message === 'Evento non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel ridimensionamento dell\'evento'
      });
    }
  }

  /**
   * Delete an event
   * DELETE /api/schedule/events/:id
   */
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await scheduleService.deleteEvent(parseInt(id), userId);

      return res.json({
        message: 'Evento eliminato con successo'
      });
    } catch (error) {
      console.error('[ScheduleController] deleteEvent error:', error);

      if (error.message === 'Evento non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'eliminazione dell\'evento'
      });
    }
  }

  /**
   * Get available colors
   * GET /api/schedule/colors
   */
  async getColors(req, res) {
    try {
      const colors = scheduleService.getColors();
      return res.json({ colors });
    } catch (error) {
      console.error('[ScheduleController] getColors error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dei colori'
      });
    }
  }
}

module.exports = new ScheduleController();
