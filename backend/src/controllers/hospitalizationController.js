const path = require('path');
const fs = require('fs');
const hospitalizationService = require('../services/hospitalizationService');

/**
 * Hospitalization Controller
 * Handles API endpoints for clinic/doctor patient and document management
 * Replicates legacy hospitalization flow
 */
class HospitalizationController {

  /**
   * Get paginated list of patients
   * GET /api/hospitalization/patients
   */
  async getPatients(req, res) {
    try {
      const businessUserId = req.user.id;
      const { name, surname, codFisc, page = 0 } = req.query;

      const result = await hospitalizationService.getPatients(
        businessUserId,
        { name, surname, codFisc },
        parseInt(page)
      );

      return res.json(result);
    } catch (error) {
      console.error('[HospitalizationController] getPatients error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dei pazienti'
      });
    }
  }

  /**
   * Approve a patient
   * POST /api/hospitalization/patients/:id/approve
   */
  async approvePatient(req, res) {
    try {
      const businessUserId = req.user.id;
      const patientId = parseInt(req.params.id);

      await hospitalizationService.approvePatient(businessUserId, patientId);

      return res.json({ message: 'Paziente approvato con successo' });
    } catch (error) {
      console.error('[HospitalizationController] approvePatient error:', error);

      if (error.message === 'Paziente non trovato') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'approvazione del paziente'
      });
    }
  }

  /**
   * Get documents for a patient
   * GET /api/hospitalization/patients/:id/documents
   */
  async getDocuments(req, res) {
    try {
      const businessUserId = req.user.id;
      const patientId = parseInt(req.params.id);
      const { page = 0 } = req.query;

      const result = await hospitalizationService.getDocuments(
        businessUserId,
        patientId,
        parseInt(page)
      );

      return res.json(result);
    } catch (error) {
      console.error('[HospitalizationController] getDocuments error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dei documenti'
      });
    }
  }

  /**
   * Upload a document for a patient
   * POST /api/hospitalization/patients/:id/documents
   */
  async uploadDocument(req, res) {
    try {
      const businessUserId = req.user.id;
      const patientId = parseInt(req.params.id);

      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      // Move file to the clinic-specific directory
      const clinicDir = path.join(
        process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
        'my_docs',
        `clinic_${businessUserId}`
      );

      if (!fs.existsSync(clinicDir)) {
        fs.mkdirSync(clinicDir, { recursive: true });
      }

      const storedName = req.file.filename;
      const destPath = path.join(clinicDir, storedName);

      // Move from temp upload dir to clinic dir
      fs.renameSync(req.file.path, destPath);

      const result = await hospitalizationService.uploadDocument(
        businessUserId,
        patientId,
        {
          originalName: req.file.originalname,
          storedName,
          details: req.body.details || null
        }
      );

      return res.json({
        message: 'Documento caricato con successo',
        document: result
      });
    } catch (error) {
      console.error('[HospitalizationController] uploadDocument error:', error);

      if (error.message === 'Relazione paziente-clinica non trovata') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel caricamento del documento'
      });
    }
  }

  /**
   * Download a document
   * GET /api/hospitalization/documents/:id/download
   */
  async downloadDocument(req, res) {
    try {
      const businessUserId = req.user.id;
      const documentId = parseInt(req.params.id);

      const document = await hospitalizationService.downloadDocument(businessUserId, documentId);

      const filePath = path.join(
        process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
        'my_docs',
        `clinic_${document.clinicId}`,
        document.doc
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File non trovato sul server' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.nameFile)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error('[HospitalizationController] downloadDocument error:', error);

      if (error.message === 'Documento non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel download del documento'
      });
    }
  }

  /**
   * Delete a document
   * DELETE /api/hospitalization/documents/:id
   */
  async deleteDocument(req, res) {
    try {
      const businessUserId = req.user.id;
      const documentId = parseInt(req.params.id);

      await hospitalizationService.deleteDocument(businessUserId, documentId);

      return res.json({ message: 'Documento eliminato con successo' });
    } catch (error) {
      console.error('[HospitalizationController] deleteDocument error:', error);

      if (error.message === 'Documento non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'eliminazione del documento'
      });
    }
  }

  /**
   * Generate a code for a patient
   * POST /api/hospitalization/generate-code
   */
  async generateCode(req, res) {
    try {
      const businessUserId = req.user.id;
      const { name, surname, codFisc } = req.body;

      if (!name || !surname || !codFisc) {
        return res.status(400).json({
          error: 'Nome, cognome e codice fiscale sono obbligatori'
        });
      }

      const result = await hospitalizationService.generateCode(
        businessUserId,
        codFisc,
        name,
        surname
      );

      return res.json({
        message: 'Codice generato con successo',
        ...result
      });
    } catch (error) {
      console.error('[HospitalizationController] generateCode error:', error);

      if (error.message === 'Formato codice fiscale non valido') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Codice già utilizzato per questo codice fiscale') {
        return res.status(409).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nella generazione del codice'
      });
    }
  }
  /**
   * Generate code and return PDF
   * POST /api/hospitalization/generate-code-pdf
   */
  async generateCodePdf(req, res) {
    try {
      const businessUserId = req.user.id;
      const { name, surname, codFisc } = req.body;

      if (!name || !surname || !codFisc) {
        return res.status(400).json({
          error: 'Nome, cognome e codice fiscale sono obbligatori'
        });
      }

      // Generate or retrieve the code
      const codeData = await hospitalizationService.generateCode(
        businessUserId,
        codFisc,
        name,
        surname
      );

      // Get business name for the PDF
      const { sequelize } = require('../config/database');
      const { QueryTypes } = require('sequelize');
      const [team] = await sequelize.query(`
        SELECT t.name FROM app_team t
        INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
        WHERE ut.app_user_id = :userId AND t.deleted = 'N'
        LIMIT 1
      `, { replacements: { userId: businessUserId }, type: QueryTypes.SELECT });

      const businessName = team?.name || 'Medico/Struttura';

      // Generate PDF
      const pdfBuffer = await hospitalizationService.generateCodePdf(codeData, businessName);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="code_authentication.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('[HospitalizationController] generateCodePdf error:', error);

      if (error.message === 'Formato codice fiscale non valido') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Codice già utilizzato per questo codice fiscale') {
        return res.status(409).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nella generazione del PDF'
      });
    }
  }

  /**
   * Verify a code for consumer authorization
   * POST /api/hospitalization/verify-code
   */
  async verifyCode(req, res) {
    try {
      const userId = req.user.id;
      const { businessId, codice, codFisc } = req.body;

      if (!businessId || !codice || !codFisc) {
        return res.status(400).json({
          error: 'Business ID, codice e codice fiscale sono obbligatori'
        });
      }

      const result = await hospitalizationService.verifyCode(
        userId,
        parseInt(businessId),
        codice,
        codFisc
      );

      return res.json({
        message: 'Identificazione avvenuta con successo',
        ...result
      });
    } catch (error) {
      console.error('[HospitalizationController] verifyCode error:', error);

      if (error.message === 'Formato codice fiscale non valido') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Match codice fiscale/codice non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Codice già utilizzato') {
        return res.status(409).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nella verifica del codice'
      });
    }
  }
}

module.exports = new HospitalizationController();
