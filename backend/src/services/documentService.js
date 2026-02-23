const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { ClinicDocument, UserClinic } = require('../models');

/**
 * Document Service
 * Handles "My Documents" business logic
 * Replicates legacy clinic document management functionality
 */
class DocumentService {

  /**
   * Get paginated documents for a user
   * Fetches documents from app_clinic_document joined with app_user_clinic and app_team
   * @param {number} userId - Current user ID
   * @param {number|null} typology - Optional typology filter (team type_id)
   * @param {number|null} clinicId - Optional clinic (team) filter
   * @param {number|null} doctorId - Optional doctor filter (not used in current query, reserved for future)
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of records per page
   * @returns {Promise<{documents: Array, total: number}>}
   */
  async getDocuments(userId, typology, clinicId, doctorId, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    let whereClause = 'WHERE uc.user_id = :userId';
    const replacements = { userId, pageSize, offset };

    if (typology) {
      whereClause += ' AND t.type_id = :typology';
      replacements.typology = typology;
    }

    if (clinicId) {
      whereClause += ' AND uc.clinic_id = :clinicId';
      replacements.clinicId = clinicId;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      JOIN app_team t ON uc.clinic_id = t.id
      ${whereClause}
    `;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const total = parseInt(countResult.total, 10);

    if (total === 0) {
      return { documents: [], total: 0 };
    }

    // Data query
    const dataQuery = `
      SELECT cd.id, cd.name_file, cd.data_load, cd.details, cd.doc,
             t.name as denomination, t.id as clinic_id, t.type_id
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      JOIN app_team t ON uc.clinic_id = t.id
      ${whereClause}
      ORDER BY cd.data_load DESC
      LIMIT :pageSize OFFSET :offset
    `;

    const documents = await sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    return {
      documents: documents.map(doc => ({
        id: doc.id,
        nameFile: doc.name_file,
        dataLoad: doc.data_load,
        details: doc.details,
        doc: doc.doc,
        denomination: doc.denomination,
        clinicId: doc.clinic_id,
        typeId: doc.type_id
      })),
      total
    };
  }

  /**
   * Get a single document for download, validating ownership
   * @param {number} documentId - ClinicDocument ID
   * @param {number} userId - Current user ID
   * @returns {Promise<Object>} Document info with file path data
   */
  async downloadDocument(documentId, userId) {
    const query = `
      SELECT cd.id, cd.name_file, cd.doc, cd.details, cd.data_load,
             uc.user_id, uc.clinic_id
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      WHERE cd.id = :documentId
    `;

    const [document] = await sequelize.query(query, {
      replacements: { documentId },
      type: QueryTypes.SELECT
    });

    if (!document) {
      throw new Error('Documento non trovato');
    }

    if (document.user_id !== userId) {
      throw new Error('Non autorizzato');
    }

    return {
      id: document.id,
      nameFile: document.name_file,
      doc: document.doc,
      details: document.details,
      dataLoad: document.data_load,
      clinicId: document.clinic_id
    };
  }

  /**
   * Delete a document, validating ownership
   * @param {number} documentId - ClinicDocument ID
   * @param {number} userId - Current user ID
   * @returns {Promise<void>}
   */
  async deleteDocument(documentId, userId) {
    // Verify ownership first
    const query = `
      SELECT cd.id, uc.user_id
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      WHERE cd.id = :documentId
    `;

    const [document] = await sequelize.query(query, {
      replacements: { documentId },
      type: QueryTypes.SELECT
    });

    if (!document) {
      throw new Error('Documento non trovato');
    }

    if (document.user_id !== userId) {
      throw new Error('Non autorizzato');
    }

    await sequelize.query('DELETE FROM app_clinic_document WHERE id = :documentId', {
      replacements: { documentId },
      type: QueryTypes.DELETE
    });
  }

  /**
   * Attach a clinic document to an examination (recommended examination)
   * Replicates legacy attachFile method:
   * - Reads the ClinicDocument and its UserClinic
   * - Verifies ownership
   * - Creates an AttachedFile record pointing to the original file
   * @param {number} documentId - ClinicDocument ID
   * @param {number} examId - RecommendedExamination ID (result_id)
   * @param {number} userId - Current user ID
   * @param {string} username - Current user's email/username
   * @returns {Promise<Object>} Created AttachedFile record info
   */
  async attachDocumentToExam(documentId, examId, userId, username) {
    // Fetch the clinic document with ownership info
    const query = `
      SELECT cd.id, cd.name_file, cd.doc, cd.details,
             uc.user_id, uc.clinic_id
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      WHERE cd.id = :documentId
    `;

    const [document] = await sequelize.query(query, {
      replacements: { documentId },
      type: QueryTypes.SELECT
    });

    if (!document) {
      throw new Error('Documento non trovato');
    }

    if (document.user_id !== userId) {
      throw new Error('Non autorizzato');
    }

    const now = new Date();

    // Build the path reference to the original file location
    // Legacy pattern: my_docs/clinic_<clinicId>/<doc>
    const pathFile = `my_docs/clinic_${document.clinic_id}/`;
    const filename = document.doc;
    const publicName = document.name_file;

    // Create AttachedFile record using raw SQL with nextval
    const [result] = await sequelize.query(`
      INSERT INTO app_attached_file (
        id, result_id, filename, public_name, path_file, public_path,
        weight, deleted, invia_notifica,
        insertion_date, insertion_username, last_modify_date, last_modify_username
      ) VALUES (
        nextval('app_attached_file_id_seq'),
        :resultId, :filename, :publicName, :pathFile, :publicPath,
        :weight, false, 'Y',
        :now, :username, :now, :username
      ) RETURNING *
    `, {
      replacements: {
        resultId: examId,
        filename,
        publicName,
        pathFile,
        publicPath: pathFile,
        weight: 0,
        now,
        username
      },
      type: QueryTypes.INSERT
    });

    return {
      id: result[0].id,
      resultId: examId,
      filename,
      publicName,
      pathFile,
      insertionDate: now
    };
  }

  /**
   * Get list of clinics that have documents for a user
   * Useful for populating filter dropdowns
   * @param {number} userId - Current user ID
   * @returns {Promise<Array>} Array of {clinicId, denomination}
   */
  async getDocumentClinics(userId) {
    const query = `
      SELECT DISTINCT t.id as clinic_id, t.name as denomination, t.type_id
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      JOIN app_team t ON uc.clinic_id = t.id
      WHERE uc.user_id = :userId
      ORDER BY t.name ASC
    `;

    const clinics = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    return clinics.map(c => ({
      clinicId: c.clinic_id,
      denomination: c.denomination,
      typeId: c.type_id
    }));
  }

  /**
   * Get all business teams by typology for filter dropdowns
   * For doctors (type_id=3): returns representative name+surname
   * For clinics (type_id=4): returns team name
   * @param {number} typeId - Typology ID (3=doctor, 4=clinic)
   * @returns {Promise<Array>} Array of {clinicId, denomination, typeId}
   */
  async getBusinessTeamsByType(typeId) {
    const query = `
      SELECT t.id as clinic_id, t.name as team_name, t.type_id,
             u.name as rep_name, u.surname as rep_surname
      FROM app_team t
      LEFT JOIN app_user u ON t.representative_id = u.id
      WHERE t.deleted = 'N' AND t.type_id = :typeId
      ORDER BY CASE WHEN :typeId = 3 THEN u.surname ELSE t.name END ASC
    `;

    const teams = await sequelize.query(query, {
      replacements: { typeId },
      type: QueryTypes.SELECT
    });

    return teams
      .filter(t => {
        if (parseInt(typeId) === 3) return t.rep_name || t.rep_surname;
        return t.team_name && t.team_name.trim() !== '';
      })
      .map(t => ({
        clinicId: t.clinic_id,
        denomination: parseInt(typeId) === 3
          ? `${t.rep_name || ''} ${t.rep_surname || ''}`.trim()
          : t.team_name,
        typeId: t.type_id
      }));
  }
}

module.exports = new DocumentService();
