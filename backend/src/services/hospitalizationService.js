const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const emailService = require('./emailService');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

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
      whereClause += ' AND LOWER(c.codfisc) LIKE LOWER(:codFisc)';
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
             c.codfisc, c.code
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
        codFisc: p.codfisc,
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
      INSERT INTO app_clinic_document (id, app_user_clinic_id, name_file, doc, data_load, details, file_data)
      VALUES (nextval('app_clinic_document_id_seq'), :ucId, :nameFile, :doc, :dataLoad, :details, :fileData)
      RETURNING *
    `;

    const [result] = await sequelize.query(insertQuery, {
      replacements: {
        ucId: userClinic.id,
        nameFile: fileInfo.originalName,
        doc: fileInfo.originalName,
        dataLoad: now,
        details: fileInfo.details || null,
        fileData: fileInfo.buffer
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
             cd.file_data,
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
      clinicId: document.clinic_id,
      fileData: document.file_data || null
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
      WHERE businessid = :businessUserId AND codfisc = :codFisc
      ORDER BY datarequest DESC
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
      INSERT INTO app_codes (id, businessid, codfisc, code, datarequest, used, name, surname)
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
  /**
   * Generate PDF for a code authentication document
   * Replicates legacy BuildGenerateCodePDF.fillPdfGenerateCode()
   * Uses the original template_consumer_2.pdf and fills form fields
   * @param {Object} codeData - { code, name, surname, codFisc }
   * @param {string} businessName - Name of the doctor/clinic
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateCodePdf(codeData, businessName) {
    const templatePath = path.join(__dirname, '../templates/template_consumer_2.pdf');
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Fill fields exactly like legacy BuildGenerateCodePDF.fillPdfGenerateCode()
    form.getTextField('row_0').setText(`Gentile ${codeData.name} ${codeData.surname},`);
    form.getTextField('row_1').setText(`Di seguito il codice fornito da ${businessName}:`);
    form.getTextField('row_2').setText(`     ${codeData.code}`);
    form.getTextField('row_3').setText('Per consentire alla clinica/medico di caricare documenti, bisogna registrarsi al sito www.pinkcare.it,');
    form.getTextField('row_4').setText('e seguire le indicazioni come di seguito:');
    form.getTextField('row_5').setText('     1.Registrarsi o loggarsi con un account già creato');
    form.getTextField('row_6').setText('     2.Dalla voce di menù, cliccare su Medici');
    form.getTextField('row_7').setText('     3.Cercare il medico o la clinica e cliccare su \'Ho un codice\'');
    form.getTextField('row_8').setText('     4.Inserire il codice fornito insieme al codice fiscale');
    form.getTextField('row_9').setText('I documenti verranno cancellati definitivamente dopo 6 mesi dalla data di caricamento');

    // Flatten form (convert fields to static text, like legacy setFormFlattening(true))
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Verify a code and create UserClinic authorization
   * Replicates legacy UserClinicServiceImpl.sendAuthorization()
   * @param {number} userId - Consumer user ID
   * @param {number} businessId - Business user ID (clinic_id)
   * @param {string} codice - 8-char authorization code
   * @param {string} codFisc - Patient fiscal code
   * @returns {Promise<Object>} Success result
   */
  async verifyCode(userId, businessId, codice, codFisc) {
    const cfPattern = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
    const upperCodFisc = codFisc.toUpperCase();

    if (!cfPattern.test(upperCodFisc)) {
      throw new Error('Formato codice fiscale non valido');
    }

    // Look up code by businessId + codFisc + codice
    const codeQuery = `
      SELECT id, code, used FROM app_codes
      WHERE businessid = :businessId AND codfisc = :codFisc AND code = :codice
      LIMIT 1
    `;

    const [codeRecord] = await sequelize.query(codeQuery, {
      replacements: { businessId, codFisc: upperCodFisc, codice },
      type: QueryTypes.SELECT
    });

    if (!codeRecord) {
      throw new Error('Match codice fiscale/codice non trovato');
    }

    if (codeRecord.used === 'Y') {
      throw new Error('Codice già utilizzato');
    }

    // Use transaction for multi-step operation
    const transaction = await sequelize.transaction();
    try {
      // Create UserClinic record with status 'approved'
      await sequelize.query(`
        INSERT INTO app_user_clinic (id, user_id, clinic_id, status, datarequest, idcode)
        VALUES (nextval('app_user_clinic_id_seq'), :userId, :businessId, 'approved', :now, :codeId)
      `, {
        replacements: {
          userId,
          businessId,
          now: new Date(),
          codeId: codeRecord.id
        },
        transaction
      });

      // Mark code as used
      await sequelize.query(`
        UPDATE app_codes SET used = 'Y' WHERE id = :codeId
      `, {
        replacements: { codeId: codeRecord.id },
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Send confirmation email to consumer (non-blocking)
    try {
      const [consumer] = await sequelize.query(
        'SELECT email, name, surname FROM app_user WHERE id = :userId',
        { replacements: { userId }, type: QueryTypes.SELECT }
      );

      const [businessTeam] = await sequelize.query(`
        SELECT t.name FROM app_team t
        INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
        WHERE ut.app_user_id = :businessId AND t.deleted = 'N'
        LIMIT 1
      `, { replacements: { businessId }, type: QueryTypes.SELECT });

      if (consumer?.email) {
        const businessName = businessTeam?.name || 'Medico/Struttura';
        let testo = '';
        testo += emailService.getPartTemplateEmail('parte_1');
        testo += `Gentile <strong>${consumer.name} ${consumer.surname},</strong><br /><br />`;
        testo += `La sua identificazione con <strong>${businessName}</strong> è avvenuta con successo.<br />`;
        testo += `Il codice utilizzato è: <strong>${codice}</strong><br /><br />`;
        testo += `Da questo momento il medico/struttura potrà caricare documenti nel suo profilo.<br />`;
        testo += emailService.getPartTemplateEmail('parte_2');

        emailService.sendNotification(
          consumer.email,
          '[PINKCARE] Identificazione avvenuta con successo',
          testo
        );
      }
    } catch (emailError) {
      console.error('[HospitalizationService] Email notification error:', emailError);
    }

    return { success: true };
  }
}

module.exports = new HospitalizationService();
