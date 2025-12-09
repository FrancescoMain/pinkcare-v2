const clinicalHistoryService = require('../services/clinicalHistoryService');
const pdfService = require('../services/pdfService');
const userService = require('../services/userService');
const { validationResult } = require('express-validator');

/**
 * Clinical History Controller
 * Handles HTTP requests for clinical history functionality
 * Migrated from consumer flow in Spring WebFlow
 */

/**
 * GET /api/clinical-history
 * Get complete consumer clinical history data
 */
exports.getConsumerData = async (req, res) => {
    try {
      const userId = req.user.userId; // From JWT middleware

      // Get active teams for user (from auth middleware)
      const teams = req.user.teams;
      if (!teams || teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Utente non associato a nessun team'
        });
      }

      const teamId = teams[0].id; // Use first team

      const consumerData = await clinicalHistoryService.getConsumerDetails(teamId);
      const surgeries = await clinicalHistoryService.getTeamSurgeries(teamId);

      // Calculate pregnancy statistics
      const gravidanceTypes = consumerData.representative?.gravidanceTypes || [];
      const pregnancyStats = clinicalHistoryService.calculatePregnancyStats(gravidanceTypes);

      res.json({
        success: true,
        data: {
          consumer: consumerData,
          surgeries: surgeries,
          pregnancyStats: pregnancyStats
        }
      });
    } catch (error) {
      console.error('Error in getConsumerData:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching consumer data',
        error: error.message
      });
    }
};

/**
 * PUT /api/clinical-history
 * Update consumer form data
 */
exports.updateConsumerForm = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.userId; // From JWT middleware
      const data = req.body;
      const username = req.user ? `${req.user.username} - ${req.user.name} ${req.user.surname}` : 'system';

      // Get active teams for user (from auth middleware)
      const teams = req.user.teams;
      if (!teams || teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Utente non associato a nessun team'
        });
      }

      const teamId = teams[0].id; // Use first team

      const updatedConsumer = await clinicalHistoryService.updateConsumerForm(
        teamId,
        data,
        username
      );

      res.json({
        success: true,
        message: 'Consumer data updated successfully',
        data: updatedConsumer
      });
    } catch (error) {
      console.error('Error in updateConsumerForm:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating consumer data',
        error: error.message
      });
    }
};

/**
 * GET /api/clinical-history/surgeries
 * Get all surgeries for a team
 */
exports.getTeamSurgeries = async (req, res) => {
    try {
      const userId = req.user.userId; // From JWT middleware

      // Get active teams for user (from auth middleware)
      const teams = req.user.teams;
      if (!teams || teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Utente non associato a nessun team'
        });
      }

      const teamId = teams[0].id; // Use first team

      const surgeries = await clinicalHistoryService.getTeamSurgeries(teamId);

      res.json({
        success: true,
        data: surgeries
      });
    } catch (error) {
      console.error('Error in getTeamSurgeries:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching team surgeries',
        error: error.message
      });
    }
};

/**
 * POST /api/clinical-history/surgeries
 * Save team surgeries
 */
exports.saveSurgeries = async (req, res) => {
    try {
      const { surgeries } = req.body;
      const username = req.user ? `${req.user.username} - ${req.user.name} ${req.user.surname}` : 'system';

      if (!Array.isArray(surgeries)) {
        return res.status(400).json({
          success: false,
          message: 'Surgeries must be an array'
        });
      }

      const savedSurgeries = await clinicalHistoryService.saveSurgeries(
        surgeries,
        username
      );

      res.json({
        success: true,
        message: 'Surgeries saved successfully',
        data: savedSurgeries
      });
    } catch (error) {
      console.error('Error in saveSurgeries:', error);
      res.status(500).json({
        success: false,
        message: 'Error saving surgeries',
        error: error.message
      });
    }
};

/**
 * GET /api/clinical-history/screening-data
 * Get screening data for thematic areas
 */
exports.getScreeningData = async (req, res) => {
    try {
      const userId = req.user.userId; // From JWT middleware
      const { thematicAreaIds } = req.query;

      // Get active teams for user (from auth middleware)
      const teams = req.user.teams;
      if (!teams || teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Utente non associato a nessun team'
        });
      }

      const teamId = teams[0].id; // Use first team

      const areaIds = thematicAreaIds ?
        (Array.isArray(thematicAreaIds) ? thematicAreaIds : [thematicAreaIds]) :
        null;

      const screeningData = await clinicalHistoryService.getScreeningDataForThematicAreas(
        teamId,
        areaIds
      );

      res.json({
        success: true,
        data: screeningData
      });
    } catch (error) {
      console.error('Error in getScreeningData:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching screening data',
        error: error.message
      });
    }
};

/**
 * GET /api/clinical-history/download-pdf
 * Download clinical history as PDF
 * This is the main endpoint that replicates the downloadConsumerDetails functionality
 */
exports.downloadClinicalHistoryPDF = async (req, res) => {
    try {
      const userId = req.user.userId; // From JWT middleware

      // Get active teams for user (from auth middleware)
      const teams = req.user.teams;
      if (!teams || teams.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Utente non associato a nessun team'
        });
      }

      const teamId = teams[0].id; // Use first team

      // Get all necessary data (don't initialize surgeries if empty - read-only for PDF)
      const consumerData = await clinicalHistoryService.getConsumerDetails(teamId);
      const surgeries = await clinicalHistoryService.getTeamSurgeries(teamId, false);
      const screeningData = await clinicalHistoryService.getScreeningDataForThematicAreas(teamId);

      // Debug: log screening data
      console.log('Screening data for PDF:', JSON.stringify(screeningData, null, 2));

      // Generate PDF
      const pdfBuffer = await pdfService.generateClinicalHistoryPDF({
        consumer: consumerData,
        surgeries: surgeries,
        thematicAreas: screeningData
      });

      console.log('PDF generated, size:', pdfBuffer.length);

      // Set response headers for PDF download
      const filename = `${consumerData.representative.name}_${consumerData.representative.surname}_storia_clinica.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error in downloadClinicalHistoryPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: error.message
      });
    }
};
