const path = require('path');
const fs = require('fs');
const examinationService = require('../services/examinationService');

/**
 * Examination Controller
 * Handles recommended examination API endpoints
 */
class ExaminationController {

  /**
   * Get age-based examinations
   * GET /api/examinations/age-based
   */
  async getAgeExaminations(req, res) {
    try {
      const teamId = req.user.teams[0]?.id;
      const birthday = req.user.birthday;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const examinations = await examinationService.getAgeExaminations(teamId, birthday);
      return res.json({ examinations });
    } catch (error) {
      console.error('[ExaminationController] getAgeExaminations error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli esami consigliati per età'
      });
    }
  }

  /**
   * Get routine examinations
   * GET /api/examinations/routine
   */
  async getRoutineExaminations(req, res) {
    try {
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const examinations = await examinationService.getRoutineExaminations(teamId);
      return res.json({ examinations });
    } catch (error) {
      console.error('[ExaminationController] getRoutineExaminations error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli esami di routine'
      });
    }
  }

  /**
   * Get screening-based examinations
   * GET /api/examinations/screening
   */
  async getScreeningExaminations(req, res) {
    try {
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const examinations = await examinationService.getScreeningExaminations(teamId);
      return res.json({ examinations });
    } catch (error) {
      console.error('[ExaminationController] getScreeningExaminations error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli esami basati sugli screening'
      });
    }
  }

  /**
   * Mark/update exam date
   * PUT /api/examinations/:id/date
   */
  async markExamDate(req, res) {
    try {
      const { id } = req.params;
      const { controlDate, examinationId, protocolRuleId } = req.body;
      const teamId = req.user.teams[0]?.id;
      const username = req.user.email;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const examId = id === 'new' ? null : parseInt(id);
      const result = await examinationService.markExamDate(
        examId, controlDate, teamId, examinationId, protocolRuleId, username
      );

      return res.json({
        message: 'Data esame aggiornata con successo',
        examination: result
      });
    } catch (error) {
      console.error('[ExaminationController] markExamDate error:', error);

      if (error.message === 'Esame non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'aggiornamento della data dell\'esame'
      });
    }
  }

  /**
   * Confirm an examination
   * PUT /api/examinations/:id/confirm
   */
  async confirmExamination(req, res) {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const username = req.user.email;

      const result = await examinationService.confirmExamination(parseInt(id), note, username);

      return res.json({
        message: 'Esame confermato con successo',
        examination: result
      });
    } catch (error) {
      console.error('[ExaminationController] confirmExamination error:', error);

      if (error.message === 'Esame non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nella conferma dell\'esame'
      });
    }
  }

  /**
   * Remove date from an examination
   * PUT /api/examinations/:id/remove-date
   */
  async removeDate(req, res) {
    try {
      const { id } = req.params;
      const username = req.user.email;

      const result = await examinationService.removeDate(parseInt(id), username);

      return res.json({
        message: 'Data esame rimossa con successo',
        examination: result
      });
    } catch (error) {
      console.error('[ExaminationController] removeDate error:', error);

      if (error.message === 'Esame non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nella rimozione della data dell\'esame'
      });
    }
  }

  /**
   * Toggle archive status of a screening
   * PUT /api/examinations/screening/:id/archive
   */
  async toggleArchiveScreening(req, res) {
    try {
      const { id } = req.params;
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const archived = await examinationService.toggleArchiveScreening(parseInt(id), teamId);

      return res.json({
        message: archived ? 'Screening archiviato' : 'Screening ripristinato',
        archived
      });
    } catch (error) {
      console.error('[ExaminationController] toggleArchiveScreening error:', error);

      if (error.message === 'Screening non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'archiviazione dello screening'
      });
    }
  }
  /**
   * Get suggested (unconfirmed) examinations for history page
   * GET /api/examinations/suggested
   */
  async getSuggestedExaminations(req, res) {
    try {
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const examinations = await examinationService.getSuggestedExaminations(teamId);
      return res.json({ examinations });
    } catch (error) {
      console.error('[ExaminationController] getSuggestedExaminations error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli esami suggeriti'
      });
    }
  }

  /**
   * Get examination history (confirmed exams)
   * GET /api/examinations/history
   */
  async getExaminationHistory(req, res) {
    try {
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const examinations = await examinationService.getExaminationHistory(teamId);
      return res.json({ examinations });
    } catch (error) {
      console.error('[ExaminationController] getExaminationHistory error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dello storico esami'
      });
    }
  }

  /**
   * Get attachments for an examination
   * GET /api/examinations/:id/attachments
   */
  async getAttachments(req, res) {
    try {
      const { id } = req.params;
      const attachments = await examinationService.getAttachments(parseInt(id));
      return res.json({ attachments });
    } catch (error) {
      console.error('[ExaminationController] getAttachments error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento degli allegati'
      });
    }
  }

  /**
   * Upload an attachment for an examination
   * POST /api/examinations/:id/attachments
   */
  async uploadAttachment(req, res) {
    try {
      const { id } = req.params;
      const username = req.user.email;

      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      const attachment = await examinationService.uploadAttachment(parseInt(id), req.file, username);
      return res.json({
        message: 'Allegato caricato con successo',
        attachment
      });
    } catch (error) {
      console.error('[ExaminationController] uploadAttachment error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dell\'allegato'
      });
    }
  }

  /**
   * Download an attachment
   * GET /api/examinations/attachments/:id/download
   */
  async downloadAttachment(req, res) {
    try {
      const { id } = req.params;
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      const attachment = await examinationService.getAttachmentFile(parseInt(id), teamId);
      const filePath = path.join(attachment.pathFile, attachment.filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File non trovato sul server' });
      }

      const mimeType = 'application/octet-stream';
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.publicName)}"`);
      res.setHeader('Content-Type', mimeType);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error('[ExaminationController] downloadAttachment error:', error);

      if (error.message === 'Allegato non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel download dell\'allegato'
      });
    }
  }

  /**
   * Delete an attachment
   * DELETE /api/examinations/attachments/:id
   */
  async deleteAttachment(req, res) {
    try {
      const { id } = req.params;
      const teamId = req.user.teams[0]?.id;

      if (!teamId) {
        return res.status(400).json({ error: 'Team non trovato per l\'utente' });
      }

      await examinationService.deleteAttachment(parseInt(id), teamId);
      return res.json({ message: 'Allegato eliminato con successo' });
    } catch (error) {
      console.error('[ExaminationController] deleteAttachment error:', error);

      if (error.message === 'Allegato non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'eliminazione dell\'allegato'
      });
    }
  }
}

module.exports = new ExaminationController();
