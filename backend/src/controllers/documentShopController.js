const documentShopService = require('../services/documentShopService');
const supabase = require('../utils/supabaseClient');
const BUCKET = 'clinic-documents';

/**
 * DocumentShop Controller
 * Handles API endpoints for document shop (upload referti per paziente)
 * Files are stored in Supabase Storage (no Vercel body size limit)
 */
class DocumentShopController {

  /**
   * Get paginated list of documents
   * GET /api/document-shop
   */
  async getDocuments(req, res) {
    try {
      const userId = req.user.id;
      const { doctorId, page = 0, pageSize = 15 } = req.query;

      const team = req.user.teams?.[0];
      const typeId = team?.type_id;

      if (typeId === 4) {
        const clinicId = await documentShopService.getClinicIdForUser(userId);
        const result = await documentShopService.getDocumentShops(
          clinicId,
          doctorId ? parseInt(doctorId) : null,
          parseInt(page),
          parseInt(pageSize)
        );
        return res.json(result);
      } else {
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
      return res.status(500).json({ error: 'Errore nel caricamento dei documenti' });
    }
  }

  /**
   * Get presigned upload URL for direct client→Supabase upload (no Vercel size limit)
   * GET /api/document-shop/upload-url?fileName=xxx.pdf
   */
  async getUploadUrl(req, res) {
    try {
      const userId = req.user.id;
      const fileName = req.query.fileName || 'document.pdf';
      const safeName = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      if (!clinicId) {
        return res.status(400).json({ error: 'Clinica non trovata' });
      }

      const storagePath = `document-shop/${clinicId}/${Date.now()}_${safeName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(storagePath);

      if (error) {
        console.error('[DocumentShopController] getUploadUrl error:', error);
        return res.status(500).json({ error: 'Errore nella generazione URL di upload' });
      }

      return res.json({ signedUrl: data.signedUrl, storagePath });
    } catch (error) {
      console.error('[DocumentShopController] getUploadUrl error:', error);
      return res.status(500).json({ error: 'Errore nella generazione URL di upload' });
    }
  }

  /**
   * Save document metadata after direct Supabase upload
   * POST /api/document-shop
   * Body (JSON): { storagePath, fileName, name_patient, surname_patient, notes, doctorId }
   */
  async uploadDocument(req, res) {
    try {
      const userId = req.user.id;
      const { storagePath, fileName, name_patient, surname_patient, notes, doctorId } = req.body;

      if (!storagePath || !fileName) {
        return res.status(400).json({ error: 'storagePath e fileName sono obbligatori' });
      }

      if (!name_patient || !surname_patient) {
        return res.status(400).json({ error: 'Nome e cognome paziente obbligatori' });
      }

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      if (!clinicId) {
        return res.status(400).json({ error: 'Clinica non trovata' });
      }

      const result = await documentShopService.addDocumentShop({
        clinicId,
        doctorId: doctorId ? parseInt(doctorId) : null,
        namePatient: name_patient,
        surnamePatient: surname_patient,
        notes: notes || null,
        originalName: fileName,
        storagePath
      });

      return res.json({ message: 'Documento caricato con successo', document: result });
    } catch (error) {
      console.error('[DocumentShopController] uploadDocument error:', error);

      if (error.message.includes('obbligatori') || error.message.includes('obbligatoria')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Errore nel caricamento del documento' });
    }
  }

  /**
   * Download a document — redirects to a short-lived signed Supabase URL
   * GET /api/document-shop/:id/download
   */
  async downloadDocument(req, res) {
    try {
      const userId = req.user.id;
      const documentId = parseInt(req.params.id);

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      const document = await documentShopService.downloadDocument(documentId, clinicId);

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(document.doc, 120); // 2-minute expiry

      if (error || !data?.signedUrl) {
        return res.status(404).json({ error: 'File non trovato nello storage' });
      }

      return res.redirect(data.signedUrl);
    } catch (error) {
      console.error('[DocumentShopController] downloadDocument error:', error);

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
   * DELETE /api/document-shop/:id
   */
  async deleteDocument(req, res) {
    try {
      const userId = req.user.id;
      const documentId = parseInt(req.params.id);

      const clinicId = await documentShopService.getClinicIdForUser(userId);
      const deletedDoc = await documentShopService.removeDocument(documentId, clinicId);

      // Best-effort delete from storage
      if (deletedDoc.doc) {
        supabase.storage.from(BUCKET).remove([deletedDoc.doc]).catch((err) => {
          console.warn('[DocumentShopController] Storage delete warning:', err.message);
        });
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

      return res.status(500).json({ error: "Errore nell'eliminazione del documento" });
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
      return res.status(500).json({ error: 'Errore nella ricerca medici' });
    }
  }
}

module.exports = new DocumentShopController();
