const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const PAGE_SIZE = 15;

/**
 * Hospitalization Service
 * Handles business logic for clinic/doctor patient management
 * Replicates legacy UserClinicService + CodeService
 */
class HospitalizationService {

  /**
   * Get the team ID for a business user.
   * In the legacy app, clinic_id in app_user_clinic corresponds to the user.id
   * of the team representative. We need to find the team where the user is representative.
   * @param {number} userId - Business user ID
   * @returns {Promise<number>} Team ID
   */
  async getBusinessTeamId(userId) {
    const query = `
      SELECT t.id
      FROM app_team t
      INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
      WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      LIMIT 1
    `;
    const [team] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });
    if (!team) {
      throw new Error('Team non trovato per questo utente');
    }
    return team.id;
  }

  /**
   * Get paginated list of patients for a business user
   * Replicates legacy UserClinicServiceImpl.getUsers()
   * @param {number} businessUserId - Business user ID
   * @param {Object} filters - Search filters { name, surname, codFisc }
   * @param {number} page - Page number (0-based)
   * @returns {Promise<{patients: Array, total: number, page: number, totalPages: number}>}
   */
  async getPatients(businessUserId, filters = {}, page = 0) {
    const offset = page * PAGE_SIZE;

    // Build WHERE conditions
    // In the legacy, clinic_id = businessUserId (the representative's user ID)
    let whereClause = 'WHERE uc.clinic_id = :businessUserId';
    const replacements = { businessUserId, pageSize: PAGE_SIZE, offset };

    if (filters.name) {
      whereClause += ' AND LOWER(u.name) LIKE LOWER(:name)';
      replacements.name = `%${filters.name}%`;
    }

    if (filters.surname) {
      whereClause += ' AND LOWER(u.surname) LIKE LOWER(:surname)';
      replacements.surname = `%${filters.surname}%`;
    }

    if (filters.codFisc) {
      whereClause += ' AND LOWER(c.cod_fisc) LIKE LOWER(:codFisc)';
      replacements.codFisc = `%${filters.codFisc}%`;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app_user_clinic uc
      JOIN app_user u ON uc.user_id = u.id
      LEFT JOIN app_codes c ON uc.idcode = c.id
      ${whereClause}
    `;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const total = parseInt(countResult.total, 10);

    if (total === 0) {
      return { patients: [], total: 0, page, totalPages: 0 };
    }

    // Data query
    const dataQuery = `
      SELECT uc.id as uc_id, uc.user_id, uc.status, uc.datarequest,
             u.name, u.surname, u.email, u.birthday,
             c.cod_fisc, c.code
      FROM app_user_clinic uc
      JOIN app_user u ON uc.user_id = u.id
      LEFT JOIN app_codes c ON uc.idcode = c.id
      ${whereClause}
      ORDER BY uc.datarequest DESC
      LIMIT :pageSize OFFSET :offset
    `;

    const patients = await sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
      patients: patients.map(p => ({
        id: p.user_id,
        ucId: p.uc_id,
        name: p.name,
        surname: p.surname,
        email: p.email,
        birthday: p.birthday,
        codFisc: p.cod_fisc,
        code: p.code,
        status: p.status,
        dataRequest: p.datarequest
      })),
      total,
      page,
      totalPages
    };
  }

  /**
   * Approve a patient (change status from 'toapprove' to 'approved')
   * @param {number} businessUserId - Business user ID
   * @param {number} patientId - Patient user ID
   * @returns {Promise<void>}
   */
  async approvePatient(businessUserId, patientId) {
    const query = `
      UPDATE app_user_clinic
      SET status = 'approved'
      WHERE user_id = :patientId AND clinic_id = :businessUserId
    `;

    const [, metadata] = await sequelize.query(query, {
      replacements: { patientId, businessUserId }
    });

    if (metadata.rowCount === 0) {
      throw new Error('Paziente non trovato');
    }
  }

  /**
   * Get paginated documents for a patient-clinic relationship
   * @param {number} businessUserId - Business user ID (clinic_id)
   * @param {number} patientId - Patient user ID
   * @param {number} page - Page number (0-based)
   * @returns {Promise<{documents: Array, total: number, page: number, totalPages: number}>}
   */
  async getDocuments(businessUserId, patientId, page = 0) {
    const offset = page * PAGE_SIZE;
    const replacements = { businessUserId, patientId, pageSize: PAGE_SIZE, offset };

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      WHERE uc.user_id = :patientId AND uc.clinic_id = :businessUserId
    `;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const total = parseInt(countResult.total, 10);

    if (total === 0) {
      return { documents: [], total: 0, page, totalPages: 0 };
    }

    const dataQuery = `
      SELECT cd.id, cd.name_file, cd.data_load, cd.details, cd.doc,
             uc.id as uc_id, uc.clinic_id
      FROM app_clinic_document cd
      JOIN app_user_clinic uc ON cd.app_user_clinic_id = uc.id
      WHERE uc.user_id = :patientId AND uc.clinic_id = :businessUserId
      ORDER BY cd.data_load DESC
      LIMIT :pageSize OFFSET :offset
    `;

    const documents = await sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return {
      documents: documents.map(doc => ({
        id: doc.id,
        nameFile: doc.name_file,
        dataLoad: doc.data_load,
        details: doc.details,
        doc: doc.doc,
        clinicId: doc.clinic_id
      })),
      total,
      page,
      totalPages
    };
  }

  /**
   * Upload a document for a patient
   * @param {number} businessUserId - Business user ID (clinic_id)
   * @param {number} patientId - Patient user ID
   * @param {Object} fileInfo - { originalName, storedName, details }
   * @returns {Promise<Object>} Created document record
   */
  async uploadDocument(businessUserId, patientId, fileInfo) {
    // Find the UserClinic relationship
    const ucQuery = `
      SELECT id FROM app_user_clinic
      WHERE user_id = :patientId AND clinic_id = :businessUserId
    `;

    const [userClinic] = await sequelize.query(ucQuery, {
      replacements: { patientId, businessUserId },
      type: QueryTypes.SELECT
    });

    if (!userClinic) {
      throw new Error('Relazione paziente-clinica non trovata');
    }

    const now = new Date();

    const insertQuery = `
      INSERT INTO app_clinic_document (id, app_user_clinic_id, name_file, doc, data_load, details)
      VALUES (nextval('app_clinic_document_id_seq'), :ucId, :nameFile, :doc, :dataLoad, :details)
      RETURNING *
    `;

    const [result] = await sequelize.query(insertQuery, {
      replacements: {
        ucId: userClinic.id,
        nameFile: fileInfo.originalName,
        doc: fileInfo.storedName,
        dataLoad: now,
        details: fileInfo.details || null
      },
      type: QueryTypes.INSERT
    });

    return {
      id: result[0].id,
      nameFile: fileInfo.originalName,
      dataLoad: now,
      details: fileInfo.details
    };
  }

  /**
   * Download a document, validating business ownership
   * @param {number} businessUserId - Business user ID
   * @param {number} documentId - Document ID
   * @returns {Promise<Object>} Document info with file path
   */
  async downloadDocument(businessUserId, documentId) {
    const query = `
      SELECT cd.id, cd.name_file, cd.doc, cd.details, cd.data_load,
             uc.clinic_id, uc.user_id
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

    if (document.clinic_id !== businessUserId) {
      throw new Error('Non autorizzato');
    }

    return {
      id: document.id,
      nameFile: document.name_file,
      doc: document.doc,
      clinicId: document.clinic_id
    };
  }

  /**
   * Delete a document, validating business ownership
   * @param {number} businessUserId - Business user ID
   * @param {number} documentId - Document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(businessUserId, documentId) {
    // Verify ownership
    const query = `
      SELECT cd.id, uc.clinic_id
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

    if (document.clinic_id !== businessUserId) {
      throw new Error('Non autorizzato');
    }

    await sequelize.query('DELETE FROM app_clinic_document WHERE id = :documentId', {
      replacements: { documentId },
      type: QueryTypes.DELETE
    });
  }

  /**
   * Generate a code for a patient
   * Replicates legacy CodeServiceImpl.generateCode()
   * @param {number} businessUserId - Business user ID
   * @param {string} codFisc - Patient fiscal code
   * @param {string} name - Patient first name
   * @param {string} surname - Patient last name
   * @returns {Promise<Object>} Generated code record
   */
  async generateCode(businessUserId, codFisc, name, surname) {
    // Validate codice fiscale format
    const cfPattern = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
    const upperCodFisc = codFisc.toUpperCase();

    if (!cfPattern.test(upperCodFisc)) {
      throw new Error('Formato codice fiscale non valido');
    }

    // Check if code already exists for this business + codFisc
    const existingQuery = `
      SELECT id, code, used FROM app_codes
      WHERE business_id = :businessUserId AND cod_fisc = :codFisc
      ORDER BY data_request DESC
      LIMIT 1
    `;

    const [existing] = await sequelize.query(existingQuery, {
      replacements: { businessUserId, codFisc: upperCodFisc },
      type: QueryTypes.SELECT
    });

    if (existing) {
      if (existing.used === 'Y') {
        throw new Error('Codice già utilizzato per questo codice fiscale');
      }
      // Return existing unused code
      return {
        id: existing.id,
        code: existing.code,
        codFisc: upperCodFisc,
        name,
        surname
      };
    }

    // Generate random 8-char alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const now = new Date();

    const insertQuery = `
      INSERT INTO app_codes (id, business_id, cod_fisc, code, data_request, used, name, surname)
      VALUES (nextval('app_code_id_seq'), :businessUserId, :codFisc, :code, :dataRequest, 'N', :name, :surname)
      RETURNING *
    `;

    const [result] = await sequelize.query(insertQuery, {
      replacements: {
        businessUserId,
        codFisc: upperCodFisc,
        code,
        dataRequest: now,
        name,
        surname
      },
      type: QueryTypes.INSERT
    });

    return {
      id: result[0].id,
      code: result[0].code,
      codFisc: upperCodFisc,
      name,
      surname
    };
  }
}

module.exports = new HospitalizationService();
