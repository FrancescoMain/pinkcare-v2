const path = require('path');
const fs = require('fs');
const documentService = require('../services/documentService');

/**
 * Document Controller
 * Handles "My Documents" API endpoints
 * Replicates legacy clinic document management
 */
class DocumentController {

  /**
   * Get paginated documents for the current user
   * GET /api/documents
   * Query params: typology, clinicId, doctorId, page, pageSize
   */
  async getDocuments(req, res) {
    try {
      const userId = req.user.id;
      const {
        typology,
        clinicId,
        doctorId,
        page = 1,
        pageSize = 10
      } = req.query;

      const result = await documentService.getDocuments(
        userId,
        typology ? parseInt(typology) : null,
        clinicId ? parseInt(clinicId) : null,
        doctorId ? parseInt(doctorId) : null,
        parseInt(page),
        parseInt(pageSize)
      );

      return res.json({
        documents: result.documents,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } catch (error) {
      console.error('[DocumentController] getDocuments error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento dei documenti'
      });
    }
  }

  /**
   * Download a document
   * GET /api/documents/:id/download
   */
  async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const document = await documentService.downloadDocument(parseInt(id), userId);

      // The doc field contains the filename stored on disk
      // Legacy path pattern: my_docs/clinic_<clinicId>/<doc>
      const filePath = path.join(
        process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
        'my_docs',
        `clinic_${document.clinicId}`,
        document.doc
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File non trovato sul server' });
      }

      const mimeType = 'application/octet-stream';
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.nameFile)}"`);
      res.setHeader('Content-Type', mimeType);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error('[DocumentController] downloadDocument error:', error);

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
   * DELETE /api/documents/:id
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await documentService.deleteDocument(parseInt(id), userId);

      return res.json({ message: 'Documento eliminato con successo' });
    } catch (error) {
      console.error('[DocumentController] deleteDocument error:', error);

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
   * Attach a clinic document to an examination
   * POST /api/documents/:id/attach/:examId
   */
  async attachToExam(req, res) {
    try {
      const { id, examId } = req.params;
      const userId = req.user.id;
      const username = req.user.email;

      const result = await documentService.attachDocumentToExam(
        parseInt(id),
        parseInt(examId),
        userId,
        username
      );

      return res.json({
        message: 'Documento allegato all\'esame con successo',
        attachment: result
      });
    } catch (error) {
      console.error('[DocumentController] attachToExam error:', error);

      if (error.message === 'Documento non trovato') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Non autorizzato') {
        return res.status(403).json({ error: error.message });
      }

      return res.status(500).json({
        error: 'Errore nell\'allegare il documento all\'esame'
      });
    }
  }

  /**
   * Get clinics that have documents for the current user (for filter dropdown)
   * GET /api/documents/clinics
   */
  async getDocumentClinics(req, res) {
    try {
      const userId = req.user.id;

      const clinics = await documentService.getDocumentClinics(userId);

      return res.json({ clinics });
    } catch (error) {
      console.error('[DocumentController] getDocumentClinics error:', error);
      return res.status(500).json({
        error: 'Errore nel caricamento delle cliniche'
      });
    }
  }
}

module.exports = new DocumentController();
