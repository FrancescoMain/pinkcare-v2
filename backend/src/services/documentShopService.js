const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const PAGE_SIZE = 15;

/**
 * DocumentShop Service
 * Handles business logic for document shop (upload referti per paziente senza UserClinic)
 * Replicates legacy DocumentShopServiceImpl.java
 */
class DocumentShopService {

  /**
   * Get paginated document list for a clinic, optionally filtered by doctor
   * @param {number} clinicId - Clinic team representative ID
   * @param {number|null} doctorId - Optional doctor filter
   * @param {number} page - Page number (0-based)
   * @param {number} pageSize - Items per page
   * @returns {Promise<{documents: Array, total: number, page: number, totalPages: number}>}
   */
  async getDocumentShops(clinicId, doctorId, page = 0, pageSize = PAGE_SIZE) {
    const offset = page * pageSize;
    const replacements = { pageSize, offset };

    let whereClause = 'WHERE 1=1';
    if (clinicId) {
      whereClause += ' AND ds.clinic_id = :clinicId';
      replacements.clinicId = clinicId;
    }
    if (doctorId) {
      whereClause += ' AND ds.doctor_id = :doctorId';
      replacements.doctorId = doctorId;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM app_documents_shop ds
      ${whereClause}
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
      SELECT ds.id, ds.doctor_id, ds.clinic_id, ds.dataload,
             ds.doc, ds.name_file, ds.name_patient, ds.surname_patient, ds.notes
      FROM app_documents_shop ds
      ${whereClause}
      ORDER BY ds.dataload DESC
      LIMIT :pageSize OFFSET :offset
    `;

    const documents = await sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      documents: documents.map(doc => ({
        id: doc.id,
        doctorId: doc.doctor_id,
        clinicId: doc.clinic_id,
        dataLoad: doc.dataload,
        doc: doc.doc,
        nameFile: doc.name_file,
        namePatient: doc.name_patient,
        surnamePatient: doc.surname_patient,
        notes: doc.notes
      })),
      total,
      page,
      totalPages
    };
  }

  /**
   * Add a new document shop record
   * @param {Object} data - { clinicId, doctorId, namePatient, surnamePatient, notes, originalName, storedName }
   * @returns {Promise<Object>} Created record
   */
  async addDocumentShop(data) {
    if (!data.clinicId) {
      throw new Error('Clinica obbligatoria');
    }
    if (!data.namePatient || !data.surnamePatient) {
      throw new Error('Nome e cognome paziente obbligatori');
    }
    if (!data.storedName) {
      throw new Error('File obbligatorio');
    }

    const now = new Date();

    const insertQuery = `
      INSERT INTO app_documents_shop (id, clinic_id, doctor_id, dataload, doc, name_file, name_patient, surname_patient, notes)
      VALUES (nextval('app_documents_shop_id_seq'), :clinicId, :doctorId, :dataLoad, :doc, :nameFile, :namePatient, :surnamePatient, :notes)
      RETURNING *
    `;

    const [result] = await sequelize.query(insertQuery, {
      replacements: {
        clinicId: data.clinicId,
        doctorId: data.doctorId || null,
        dataLoad: now,
        doc: data.storedName,
        nameFile: data.originalName,
        namePatient: data.namePatient,
        surnamePatient: data.surnamePatient,
        notes: data.notes || null
      },
      type: QueryTypes.INSERT
    });

    return {
      id: result[0].id,
      nameFile: data.originalName,
      dataLoad: now,
      namePatient: data.namePatient,
      surnamePatient: data.surnamePatient,
      notes: data.notes
    };
  }

  /**
   * Remove a document (delete from DB)
   * @param {number} documentId - Document ID
   * @param {number} userRepId - User's representative ID (clinic_id or doctor_id)
   * @returns {Promise<Object>} Deleted document info (for file cleanup)
   */
  async removeDocument(documentId, userRepId) {
    const query = `
      SELECT id, doc, clinic_id, doctor_id FROM app_documents_shop WHERE id = :documentId
    `;
    const [document] = await sequelize.query(query, {
      replacements: { documentId },
      type: QueryTypes.SELECT
    });

    if (!document) {
      throw new Error('Documento non trovato');
    }

    // Authorize: user must be the clinic owner or the doctor
    if (document.clinic_id !== userRepId && document.doctor_id !== userRepId) {
      throw new Error('Non autorizzato');
    }

    await sequelize.query('DELETE FROM app_documents_shop WHERE id = :documentId', {
      replacements: { documentId },
      type: QueryTypes.DELETE
    });

    return { doc: document.doc, clinicId: document.clinic_id };
  }

  /**
   * Get document info for download
   * @param {number} documentId - Document ID
   * @param {number} userRepId - User's representative ID (clinic_id or doctor_id)
   * @returns {Promise<Object>} Document info
   */
  async downloadDocument(documentId, userRepId) {
    const query = `
      SELECT id, doc, name_file, clinic_id, doctor_id FROM app_documents_shop WHERE id = :documentId
    `;
    const [document] = await sequelize.query(query, {
      replacements: { documentId },
      type: QueryTypes.SELECT
    });

    if (!document) {
      throw new Error('Documento non trovato');
    }

    // Authorize: user must be the clinic owner or the doctor
    if (document.clinic_id !== userRepId && document.doctor_id !== userRepId) {
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
   * Autocomplete search for doctors linked to a clinic
   * @param {string} query - Search text (min 3 chars)
   * @param {number} clinicId - Clinic team ID
   * @returns {Promise<Array>} Matching doctors
   */
  async autocompleteDoctors(query, clinicId) {
    if (!query || query.length < 3) return [];

    // Find doctors (users with ROLE_BUSINESS and team type=DOCTOR)
    // that are linked to the clinic via some relationship or all doctors
    const searchQuery = `
      SELECT DISTINCT u.id, u.name, u.surname, u.email
      FROM app_user u
      INNER JOIN app_user_role ur ON u.id = ur.user_id
      INNER JOIN app_role r ON ur.role_id = r.id
      INNER JOIN app_user_app_team ut ON u.id = ut.app_user_id
      INNER JOIN app_team t ON ut.teams_id = t.id
      WHERE r.name = 'ROLE_BUSINESS'
        AND t.type_id = 3
        AND t.deleted = 'N'
        AND (LOWER(u.name) LIKE LOWER(:search) OR LOWER(u.surname) LIKE LOWER(:search) OR LOWER(u.email) LIKE LOWER(:search))
      ORDER BY u.surname, u.name
      LIMIT 10
    `;

    const doctors = await sequelize.query(searchQuery, {
      replacements: { search: `%${query}%` },
      type: QueryTypes.SELECT
    });

    return doctors.map(d => ({
      id: d.id,
      name: d.name,
      surname: d.surname,
      email: d.email,
      label: `${d.surname} ${d.name} (${d.email})`
    }));
  }

  /**
   * Get the clinic team ID (representative_id) for a business user
   * Used for clinic-type users to find their team
   * @param {number} userId
   * @returns {Promise<number|null>}
   */
  async getClinicIdForUser(userId) {
    const query = `
      SELECT t.id, t.representative_id
      FROM app_team t
      INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
      WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      LIMIT 1
    `;
    const [team] = await sequelize.query(query, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });
    // In legacy, clinic_id in documents_shop = representative_id of the team
    return team ? (team.representative_id || team.id) : null;
  }
}

module.exports = new DocumentShopService();
