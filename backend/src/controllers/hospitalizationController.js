const hospitalizationService = require('../services/hospitalizationService');
const supabase = require('../utils/supabaseClient');
const BUCKET = 'clinic-documents';

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
   * Get presigned upload URL for direct client→Supabase upload (no Vercel size limit)
   * GET /api/hospitalization/patients/:id/upload-url?fileName=xxx.pdf
   */
  async getUploadUrl(req, res) {
    try {
      const businessUserId = req.user.id;
      const patientId = parseInt(req.params.id);
      const fileName = req.query.fileName || 'document.pdf';
      const safeName = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `hospitalization/${businessUserId}/${patientId}/${Date.now()}_${safeName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(storagePath);

      if (error) {
        console.error('[HospitalizationController] getUploadUrl error:', error);
        return res.status(500).json({ error: 'Errore nella generazione URL di upload' });
      }

      return res.json({ signedUrl: data.signedUrl, storagePath });
    } catch (error) {
      console.error('[HospitalizationController] getUploadUrl error:', error);
      return res.status(500).json({ error: 'Errore nella generazione URL di upload' });
    }
  }

  /**
   * Save document metadata after direct Supabase upload
   * POST /api/hospitalization/patients/:id/documents
   * Body (JSON): { storagePath, fileName, details }
   */
  async uploadDocument(req, res) {
    try {
      const businessUserId = req.user.id;
      const patientId = parseInt(req.params.id);
      const { storagePath, fileName, details } = req.body;

      if (!storagePath || !fileName) {
        return res.status(400).json({ error: 'storagePath e fileName sono obbligatori' });
      }

      const result = await hospitalizationService.uploadDocument(
        businessUserId,
        patientId,
        { originalName: fileName, storagePath, details: details || null }
      );

      return res.json({ message: 'Documento caricato con successo', document: result });
    } catch (error) {
      console.error('[HospitalizationController] uploadDocument error:', error);

      if (error.message === 'Relazione paziente-clinica non trovata') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Errore nel caricamento del documento' });
    }
  }

  /**
   * Download a document — redirects to a short-lived signed Supabase URL
   * GET /api/hospitalization/documents/:id/download
   */
  async downloadDocument(req, res) {
    try {
      const businessUserId = req.user.id;
      const documentId = parseInt(req.params.id);

      const document = await hospitalizationService.downloadDocument(businessUserId, documentId);

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(document.doc, 120); // 2-minute expiry

      if (error || !data?.signedUrl) {
        return res.status(404).json({ error: 'File non trovato nello storage' });
      }

      return res.redirect(data.signedUrl);
    } catch (error) {
      console.error('[HospitalizationController] downloadDocument error:', error);

      if (error.message === 'Documento non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Errore nel download del documento' });
    }
  }

  /**
   * Delete a document (DB record + Supabase Storage file)
   * DELETE /api/hospitalization/documents/:id
   */
  async deleteDocument(req, res) {
    try {
      const businessUserId = req.user.id;
      const documentId = parseInt(req.params.id);

      const storagePath = await hospitalizationService.deleteDocument(businessUserId, documentId);

      // Best-effort delete from storage (non-blocking)
      if (storagePath) {
        supabase.storage.from(BUCKET).remove([storagePath]).catch((err) => {
          console.warn('[HospitalizationController] Storage delete warning:', err.message);
        });
      }

      return res.json({ message: 'Documento eliminato con successo' });
    } catch (error) {
      console.error('[HospitalizationController] deleteDocument error:', error);

      if (error.message === 'Documento non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({ error: "Errore nell'eliminazione del documento" });
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
