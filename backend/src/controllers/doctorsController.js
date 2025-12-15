const { validationResult } = require('express-validator');
const doctorsService = require('../services/doctorsService');

/**
 * Doctors Controller
 * Handles HTTP requests for doctors/clinics listing
 */
class DoctorsController {

  /**
   * GET /api/doctors
   * Search doctors with filters and pagination
   */
  async search(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Parametri non validi',
          details: errors.array()
        });
      }

      const {
        type,
        examination,
        pathology,
        municipalityId,
        lat,
        lon,
        radius,
        query,
        page = 1,
        size = 15
      } = req.query;

      // Use user's location as default if no coordinates provided and user is authenticated
      const userLocation = req.user?.location;
      const searchLat = lat || (userLocation?.lat) || null;
      const searchLon = lon || (userLocation?.lon) || null;

      const filters = {
        type: type ? parseInt(type, 10) : null,
        examination: examination ? parseInt(examination, 10) : null,
        pathology: pathology ? parseInt(pathology, 10) : null,
        municipalityId: municipalityId ? parseInt(municipalityId, 10) : null,
        lat: searchLat,
        lon: searchLon,
        radius: radius ? parseFloat(radius) : null,
        query: query || null
      };

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(size, 10) || 15));

      const result = await doctorsService.search(filters, pageNum, pageSize);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[DoctorsController] search error:', error);
      return res.status(500).json({
        error: 'Errore nella ricerca dei medici'
      });
    }
  }

  /**
   * GET /api/doctors/:id
   * Get doctor details by ID
   */
  async getById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'ID non valido',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const doctor = await doctorsService.getById(parseInt(id, 10));

      return res.json({
        success: true,
        data: doctor
      });
    } catch (error) {
      console.error('[DoctorsController] getById error:', error);

      if (error.message === 'Medico non trovato') {
        return res.status(404).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Errore nel recupero dei dati del medico'
      });
    }
  }

  /**
   * GET /api/doctors/autocomplete
   * Autocomplete search for doctors by name
   */
  async autocomplete(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const results = await doctorsService.autocomplete(
        q,
        Math.min(20, Math.max(1, parseInt(limit, 10) || 10))
      );

      return res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('[DoctorsController] autocomplete error:', error);
      return res.status(500).json({
        error: 'Errore nella ricerca'
      });
    }
  }

  /**
   * GET /api/doctors/examinations
   * Get all examinations for filter dropdown
   */
  async getExaminations(req, res) {
    try {
      const examinations = await doctorsService.getExaminations();

      return res.json({
        success: true,
        data: examinations
      });
    } catch (error) {
      console.error('[DoctorsController] getExaminations error:', error);
      return res.status(500).json({
        error: 'Errore nel recupero degli esami'
      });
    }
  }

  /**
   * GET /api/doctors/pathologies
   * Get all pathologies for filter dropdown
   */
  async getPathologies(req, res) {
    try {
      const pathologies = await doctorsService.getPathologies();

      return res.json({
        success: true,
        data: pathologies
      });
    } catch (error) {
      console.error('[DoctorsController] getPathologies error:', error);
      return res.status(500).json({
        error: 'Errore nel recupero delle patologie'
      });
    }
  }
}

module.exports = new DoctorsController();
