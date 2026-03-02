const businessService = require('../services/businessService');

/**
 * Business Controller
 * Handles API endpoints for the Scheda Personale (business profile form)
 * Replicates legacy business_form.xhtml flow
 */
class BusinessController {

  /**
   * Get complete business profile
   * GET /api/business/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await businessService.getBusinessProfile(userId);
      return res.json(profile);
    } catch (error) {
      console.error('[BusinessController] getProfile error:', error);
      if (error.message === 'Team non trovato') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({
        error: 'Errore nel caricamento del profilo business'
      });
    }
  }

  /**
   * Update business profile fields (_to_validate)
   * PUT /api/business/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      await businessService.updateBusinessProfile(userId, req.body);
      return res.json({ message: 'Profilo aggiornato con successo' });
    } catch (error) {
      console.error('[BusinessController] updateProfile error:', error);
      if (error.message === 'Team non trovato per questo utente') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({
        error: 'Errore nell\'aggiornamento del profilo'
      });
    }
  }

  /**
   * Update business address (direct save)
   * PUT /api/business/address
   */
  async updateAddress(req, res) {
    try {
      const userId = req.user.id;
      await businessService.updateBusinessAddress(userId, req.body);
      return res.json({ message: 'Indirizzo aggiornato con successo' });
    } catch (error) {
      console.error('[BusinessController] updateAddress error:', error);
      if (error.message === 'Indirizzo non trovato per questo team') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({
        error: 'Errore nell\'aggiornamento dell\'indirizzo'
      });
    }
  }

  /**
   * Update team examinations
   * PUT /api/business/examinations
   */
  async updateExaminations(req, res) {
    try {
      const userId = req.user.id;
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids deve essere un array' });
      }
      await businessService.updateTeamExaminations(userId, ids);
      return res.json({ message: 'Prestazioni aggiornate con successo' });
    } catch (error) {
      console.error('[BusinessController] updateExaminations error:', error);
      return res.status(500).json({
        error: 'Errore nell\'aggiornamento delle prestazioni'
      });
    }
  }

  /**
   * Update team pathologies
   * PUT /api/business/pathologies
   */
  async updatePathologies(req, res) {
    try {
      const userId = req.user.id;
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids deve essere un array' });
      }
      await businessService.updateTeamPathologies(userId, ids);
      return res.json({ message: 'Patologie aggiornate con successo' });
    } catch (error) {
      console.error('[BusinessController] updatePathologies error:', error);
      return res.status(500).json({
        error: 'Errore nell\'aggiornamento delle patologie'
      });
    }
  }
}

module.exports = new BusinessController();
