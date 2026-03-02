const path = require('path');
const fs = require('fs');
const documentShopService = require('../services/documentShopService');

/**
 * DocumentShop Controller
 * Handles API endpoints for document shop (upload referti per paziente)
 * Replicates legacy documentshop flow
 */
class DocumentShopController {

  /**
   * Get paginated list of documents
   * GET /api/document-shop
   * For CLINIC users: filters by clinic_id, optionally by doctorId
   * For DOCTOR users: filters by doctor_id (their own user ID)
   */
  async getDocuments(req, res) {
    try {
      const userId = req.user.id;
      const { doctorId, page = 0, pageSize = 15 } = req.query;

      // Determine user's team type
      const team = req.user.teams?.[0];
      const typeId = team?.type_id;

      if (typeId === 4) {
        // CLINIC user: query by clinic_id, optionally filter by doctor
        const clinicId = await documentShopService.getClinicIdForUser(userId);
        const result = await documentShopService.getDocumentShops(
          clinicId,
          doctorId ? parseInt(doctorId) : null,
          parseInt(page),
          parseInt(pageSize)
        );
        return res.json(result);
      } else {
        // DOCTOR user: query by doctor_id = their representative_id
        const doctorRepId = await documentShopService.getClinicIdForUser(userId);
        const result = await documentShopService.getDocumentShops(
          null,
          doctorRepId,
          parseInt(page),
          parseInt(pageSize)
        );
        return res.json(result);
      }
    } catch (error) {
      console.error('[DocumentShopController] getDocuments error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dei documenti'
      });
    }
  }

  /**
   * Upload a new document
   * POST /api/document-shop
   */
  async uploadDocument(req, res) {
    try {
      const userId = req.user.id;
      const { name_patient, surname_patient, notes, doctorId } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      if (!name_patient || !surname_patient) {
        return res.status(400).json({ error: 'Nome e cognome paziente obbligatori' });
      }

      // Get the user's clinic ID
      const clinicId = await documentShopService.getClinicIdForUser(userId);
      if (!clinicId) {
        return res.status(400).json({ error: 'Clinica non trovata' });
      }

      // Move file to clinic-specific directory
      const clinicDir = path.join(
        process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
        'my_docs',
        `shop_clinic_${clinicId}`
      );

      if (!fs.existsSync(clinicDir)) {
        fs.mkdirSync(clinicDir, { recursive: true });
      }

      const storedName = req.file.filename;
      const destPath = path.join(clinicDir, storedName);

      // Move from temp upload dir to clinic dir
      fs.renameSync(req.file.path, destPath);

      const result = await documentShopService.addDocumentShop({
        clinicId,
        doctorId: doctorId ? parseInt(doctorId) : null,
        namePatient: name_patient,
        surnamePatient: surname_patient,
        notes: notes || null,
        originalName: req.file.originalname,
        storedName
      });

      return res.json({
        message: 'Documento caricato con successo',
        document: result
      });
    } catch (error) {
      console.error('[DocumentShopController] uploadDocument error:', error);

      if (error.message.includes('obbligatori') || error.message.includes('obbligatoria')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nel caricamento del documento'
      });
    }
  }

  /**
   * Download a document
   * GET /api/document-shop/:id/download
   */
  async downloadDocument(req, res) {
    try {
      const userId = req.user.id;
      const documentId = parseInt(req.params.id);

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      const document = await documentShopService.downloadDocument(documentId, clinicId);

      const filePath = path.join(
        process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
        'my_docs',
        `shop_clinic_${document.clinicId}`,
        document.doc
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File non trovato sul server' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.nameFile)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error('[DocumentShopController] downloadDocument error:', error);

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
   * DELETE /api/document-shop/:id
   */
  async deleteDocument(req, res) {
    try {
      const userId = req.user.id;
      const documentId = parseInt(req.params.id);

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      const deletedDoc = await documentShopService.removeDocument(documentId, clinicId);

      // Try to delete file from disk
      try {
        const filePath = path.join(
          process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
          'my_docs',
          `shop_clinic_${deletedDoc.clinicId}`,
          deletedDoc.doc
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn('[DocumentShopController] Could not delete file from disk:', fileErr.message);
      }

      return res.json({ message: 'Documento eliminato con successo' });
    } catch (error) {
      console.error('[DocumentShopController] deleteDocument error:', error);

      if (error.message === 'Documento non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: "Errore nell'eliminazione del documento"
      });
    }
  }

  /**
   * Autocomplete search for doctors
   * GET /api/document-shop/doctors
   */
  async searchDoctors(req, res) {
    try {
      const userId = req.user.id;
      const { q } = req.query;

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      const doctors = await documentShopService.autocompleteDoctors(q, clinicId);

      return res.json(doctors);
    } catch (error) {
      console.error('[DocumentShopController] searchDoctors error:', error);
      return res.status(500).json({
        error: 'Errore nella ricerca medici'
      });
    }
  }
}

module.exports = new DocumentShopController();
