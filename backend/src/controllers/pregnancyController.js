const pregnancyService = require('../services/pregnancyService');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

class PregnancyController {

  /**
   * GET /api/pregnancy/status
   * Returns current pregnancy status (active/inactive, dates, week number)
   */
  async getStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const teams = req.user.teams;

      if (!teams || teams.length === 0) {
        return res.status(400).json({ error: 'Utente non associato a nessun team' });
      }

      const teamId = teams[0].id;
      const status = await pregnancyService.getPregnancyStatus(userId, teamId);

      res.json(status);
    } catch (error) {
      console.error('Error getting pregnancy status:', error);
      res.status(500).json({ error: error.message || 'Errore nel recupero dello stato gravidanza' });
    }
  }

  /**
   * POST /api/pregnancy/calculate
   * Calculate due date from last menses date and cycle duration
   * Body: { lastMensesDate, durationPeriod }
   */
  async calculate(req, res, next) {
    try {
      const { lastMensesDate, durationPeriod } = req.body;
      const teams = req.user.teams;

      if (!lastMensesDate) {
        return res.status(400).json({ error: 'Data ultima mestruazione obbligatoria' });
      }

      const duration = parseInt(durationPeriod);
      if (!duration || duration < 22 || duration > 45) {
        return res.status(400).json({ error: 'La durata del ciclo deve essere tra 22 e 45 giorni' });
      }

      // Validate date is not in the future
      const lmpDate = new Date(lastMensesDate);
      if (lmpDate > new Date()) {
        return res.status(400).json({ error: 'La data non può essere nel futuro' });
      }

      const teamId = teams && teams.length > 0 ? teams[0].id : null;

      const result = await pregnancyService.calculateDueDate(lastMensesDate, duration, teamId);

      res.json({
        ovulationDate: result.ovulationDate,
        childbirthdate: result.childbirthdate,
        weekNumber: result.weekNumber,
        hasOverlap: result.hasOverlap
      });
    } catch (error) {
      console.error('Error calculating due date:', error);
      res.status(500).json({ error: error.message || 'Errore nel calcolo della data parto' });
    }
  }

  /**
   * POST /api/pregnancy/save
   * Save calculated pregnancy data
   * Body: { childbirthdate, ovulationDate }
   */
  async save(req, res, next) {
    try {
      const { childbirthdate, ovulationDate } = req.body;
      const userId = req.user.userId;
      const teams = req.user.teams;

      if (!childbirthdate || !ovulationDate) {
        return res.status(400).json({ error: 'Data parto e data ovulazione sono obbligatorie' });
      }

      if (!teams || teams.length === 0) {
        return res.status(400).json({ error: 'Utente non associato a nessun team' });
      }

      const teamId = teams[0].id;

      const result = await pregnancyService.savePregnancy(userId, teamId, childbirthdate, ovulationDate);

      res.json({
        success: true,
        childbirthdate: result.childbirthdate,
        ovulationDate: result.ovulationDate,
        weekNumber: result.weekNumber
      });
    } catch (error) {
      console.error('Error saving pregnancy:', error);
      res.status(500).json({ error: error.message || 'Errore nel salvataggio della gravidanza' });
    }
  }

  /**
   * POST /api/pregnancy/terminate
   * Terminate current pregnancy
   * Body: { pregnancyEndedDate }
   */
  async terminate(req, res, next) {
    try {
      const { pregnancyEndedDate } = req.body;
      const userId = req.user.userId;
      const teams = req.user.teams;

      if (!teams || teams.length === 0) {
        return res.status(400).json({ error: 'Utente non associato a nessun team' });
      }

      const teamId = teams[0].id;

      await pregnancyService.terminatePregnancy(userId, teamId, pregnancyEndedDate);

      res.json({ success: true });
    } catch (error) {
      console.error('Error terminating pregnancy:', error);
      res.status(500).json({ error: error.message || 'Errore nella terminazione della gravidanza' });
    }
  }
}

module.exports = new PregnancyController();
