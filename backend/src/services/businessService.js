const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Business Service
 * Handles business logic for the Scheda Personale (business_form.xhtml)
 * Replicates legacy TeamService + BusinessController flow
 */
class BusinessService {

  /**
   * Get the team for a business user
   * @param {number} userId - Business user ID
   * @returns {Promise<Object>} Team record
   */
  async getBusinessTeam(userId) {
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
    if (!team) {
      throw new Error('Team non trovato per questo utente');
    }
    return team;
  }

  /**
   * Get the complete business profile for the Scheda Personale page
   * @param {number} userId - Business user ID
   * @returns {Promise<Object>} Complete profile data
   */
  async getBusinessProfile(userId) {
    // 1. Get team with address, representative and type
    const teamQuery = `
      SELECT t.id, t.name, t.name_to_validate, t.logo, t.email, t.email_to_validate,
             t.description, t.description_to_validate,
             t.medical_publications, t.medical_publications_to_validate,
             t.structure_dimension, t.structure_dimension_to_validate,
             t.instrumentation, t.instrumentation_to_validate,
             t.linkshop, t.linkshop_to_validate,
             t.medical_title, t.medical_title_to_validate,
             t.searchable, t.representative_id, t.address_id,
             ty.id as type_id, ty.label as type_label,
             a.id as address_id, a.street_type, a.street, a.street_number,
             a.municipality, a.province, a.post_code, a.latitude, a.longitude,
             a.region, a.nation,
             u.id as rep_id, u.name as rep_name, u.surname as rep_surname,
             u.name_to_validate as rep_name_to_validate,
             u.surname_to_validate as rep_surname_to_validate,
             u.email as rep_email,
             CONCAT(COALESCE(u.name, ''), ' ', COALESCE(u.surname, '')) as rep_complete_name,
             CONCAT(
               COALESCE(u.name_to_validate, u.name, ''), ' ',
               COALESCE(u.surname_to_validate, u.surname, '')
             ) as rep_complete_name_to_validate
      FROM app_team t
      INNER JOIN app_user_app_team ut ON t.id = ut.teams_id
      LEFT JOIN app_typology ty ON t.type_id = ty.id
      LEFT JOIN app_address a ON t.address_id = a.id
      LEFT JOIN app_user u ON t.representative_id = u.id
      WHERE ut.app_user_id = :userId AND t.deleted = 'N'
      LIMIT 1
    `;

    const [team] = await sequelize.query(teamQuery, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });

    if (!team) {
      throw new Error('Team non trovato');
    }

    // 2. Get team examinations (validated ones)
    const examinationsQuery = `
      SELECT tep.id as tep_id, tep.validated,
             ep.id as ep_id, ep.label
      FROM app_team_examination_pathology tep
      INNER JOIN app_examination_pathology ep ON tep.examination_pathology_id = ep.id
      WHERE tep.team_id = :teamId AND tep.deleted = false AND ep.examination = true
      ORDER BY ep.label
    `;

    const teamExaminations = await sequelize.query(examinationsQuery, {
      replacements: { teamId: team.id },
      type: QueryTypes.SELECT
    });

    // 3. Get team pathologies (validated ones)
    const pathologiesQuery = `
      SELECT tep.id as tep_id, tep.validated,
             ep.id as ep_id, ep.label
      FROM app_team_examination_pathology tep
      INNER JOIN app_examination_pathology ep ON tep.examination_pathology_id = ep.id
      WHERE tep.team_id = :teamId AND tep.deleted = false AND ep.examination = false
      ORDER BY ep.label
    `;

    const teamPathologies = await sequelize.query(pathologiesQuery, {
      replacements: { teamId: team.id },
      type: QueryTypes.SELECT
    });

    // 4. Get all examinations (for the dropdown)
    const allExaminationsQuery = `
      SELECT id, label FROM app_examination_pathology
      WHERE examination = true
      ORDER BY label
    `;

    const allExaminations = await sequelize.query(allExaminationsQuery, {
      type: QueryTypes.SELECT
    });

    // 5. Get all pathologies (for the dropdown)
    const allPathologiesQuery = `
      SELECT id, label FROM app_examination_pathology
      WHERE examination = false
      ORDER BY label
    `;

    const allPathologies = await sequelize.query(allPathologiesQuery, {
      type: QueryTypes.SELECT
    });

    // 6. Get medical titles (for the dropdown)
    const medicalTitlesQuery = `
      SELECT id, label FROM app_typology
      WHERE pertinence = 'medical_title'
      ORDER BY label
    `;

    const medicalTitles = await sequelize.query(medicalTitlesQuery, {
      type: QueryTypes.SELECT
    });

    return {
      team: {
        id: team.id,
        name: team.name,
        nameToValidate: team.name_to_validate,
        logo: team.logo,
        email: team.email,
        emailToValidate: team.email_to_validate,
        description: team.description,
        descriptionToValidate: team.description_to_validate,
        medicalPublications: team.medical_publications,
        medicalPublicationsToValidate: team.medical_publications_to_validate,
        structureDimension: team.structure_dimension,
        structureDimensionToValidate: team.structure_dimension_to_validate,
        instrumentation: team.instrumentation,
        instrumentationToValidate: team.instrumentation_to_validate,
        linkshop: team.linkshop,
        linkshopToValidate: team.linkshop_to_validate,
        medicalTitle: team.medical_title,
        medicalTitleToValidate: team.medical_title_to_validate,
        searchable: team.searchable,
        type: {
          id: team.type_id,
          label: team.type_label
        },
        address: team.address_id ? {
          streetType: team.street_type,
          street: team.street,
          streetNumber: team.street_number,
          municipality: team.municipality,
          province: team.province,
          postCode: team.post_code,
          latitude: team.latitude,
          longitude: team.longitude
        } : null,
        representative: {
          id: team.rep_id,
          name: team.rep_name,
          surname: team.rep_surname,
          nameToValidate: team.rep_name_to_validate,
          surnameToValidate: team.rep_surname_to_validate,
          email: team.rep_email,
          completeName: team.rep_complete_name,
          completeNameToValidate: team.rep_complete_name_to_validate
        }
      },
      teamExaminations: teamExaminations.map(e => ({
        id: e.tep_id,
        validated: e.validated,
        examinationPathology: { id: e.ep_id, label: e.label }
      })),
      teamPathologies: teamPathologies.map(p => ({
        id: p.tep_id,
        validated: p.validated,
        examinationPathology: { id: p.ep_id, label: p.label }
      })),
      allExaminations,
      allPathologies,
      medicalTitles
    };
  }

  /**
   * Update business profile fields (sets _to_validate fields)
   * @param {number} userId - Business user ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateBusinessProfile(userId, updates) {
    const team = await this.getBusinessTeam(userId);
    const transaction = await sequelize.transaction();

    try {
      // Team _to_validate fields whitelist
      const teamFields = {};
      if (updates.nameToValidate !== undefined) teamFields.name_to_validate = updates.nameToValidate;
      if (updates.medicalTitleToValidate !== undefined) teamFields.medical_title_to_validate = updates.medicalTitleToValidate;
      if (updates.descriptionToValidate !== undefined) teamFields.description_to_validate = updates.descriptionToValidate;
      if (updates.medicalPublicationsToValidate !== undefined) teamFields.medical_publications_to_validate = updates.medicalPublicationsToValidate;
      if (updates.structureDimensionToValidate !== undefined) teamFields.structure_dimension_to_validate = updates.structureDimensionToValidate;
      if (updates.instrumentationToValidate !== undefined) teamFields.instrumentation_to_validate = updates.instrumentationToValidate;
      if (updates.linkshopToValidate !== undefined) teamFields.linkshop_to_validate = updates.linkshopToValidate;

      // Update team fields if any
      if (Object.keys(teamFields).length > 0) {
        const setClauses = Object.keys(teamFields).map((k, i) => `${k} = :val_${i}`);
        const replacements = { teamId: team.id };
        Object.keys(teamFields).forEach((k, i) => {
          replacements[`val_${i}`] = teamFields[k];
        });

        await sequelize.query(
          `UPDATE app_team SET ${setClauses.join(', ')} WHERE id = :teamId`,
          { replacements, transaction }
        );
      }

      // Representative fields (on app_user)
      const repFields = {};
      if (updates.repNameToValidate !== undefined) repFields.name_to_validate = updates.repNameToValidate;
      if (updates.repSurnameToValidate !== undefined) repFields.surname_to_validate = updates.repSurnameToValidate;

      if (Object.keys(repFields).length > 0) {
        const setClauses = Object.keys(repFields).map((k, i) => `${k} = :rval_${i}`);
        const replacements = { repId: team.representative_id };
        Object.keys(repFields).forEach((k, i) => {
          replacements[`rval_${i}`] = repFields[k];
        });

        await sequelize.query(
          `UPDATE app_user SET ${setClauses.join(', ')} WHERE id = :repId`,
          { replacements, transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update business address (direct save, no _to_validate pattern)
   * @param {number} userId - Business user ID
   * @param {Object} addressData - Address fields
   * @returns {Promise<void>}
   */
  async updateBusinessAddress(userId, addressData) {
    const team = await this.getBusinessTeam(userId);

    // Get team's address_id
    const [teamRow] = await sequelize.query(
      'SELECT address_id FROM app_team WHERE id = :teamId',
      { replacements: { teamId: team.id }, type: QueryTypes.SELECT }
    );

    if (!teamRow || !teamRow.address_id) {
      throw new Error('Indirizzo non trovato per questo team');
    }

    // Whitelist address fields
    const fields = {};
    if (addressData.streetType !== undefined) fields.street_type = addressData.streetType;
    if (addressData.street !== undefined) fields.street = addressData.street;
    if (addressData.streetNumber !== undefined) fields.street_number = addressData.streetNumber;
    if (addressData.municipality !== undefined) fields.municipality = addressData.municipality;
    if (addressData.province !== undefined) fields.province = addressData.province;
    if (addressData.postCode !== undefined) fields.post_code = addressData.postCode;

    if (Object.keys(fields).length === 0) return;

    const setClauses = Object.keys(fields).map((k, i) => `${k} = :aval_${i}`);
    const replacements = { addressId: teamRow.address_id };
    Object.keys(fields).forEach((k, i) => {
      replacements[`aval_${i}`] = fields[k];
    });

    await sequelize.query(
      `UPDATE app_address SET ${setClauses.join(', ')} WHERE id = :addressId`,
      { replacements }
    );
  }

  /**
   * Update team examinations (mark as pending validation)
   * @param {number} userId - Business user ID
   * @param {number[]} epIds - ExaminationPathology IDs to set
   * @returns {Promise<void>}
   */
  async updateTeamExaminations(userId, epIds) {
    const team = await this.getBusinessTeam(userId);
    const transaction = await sequelize.transaction();

    try {
      // Get current examinations
      const currentQuery = `
        SELECT id, examination_pathology_id
        FROM app_team_examination_pathology
        WHERE team_id = :teamId AND deleted = false
          AND examination_pathology_id IN (
            SELECT id FROM app_examination_pathology WHERE examination = true
          )
      `;
      const current = await sequelize.query(currentQuery, {
        replacements: { teamId: team.id },
        type: QueryTypes.SELECT,
        transaction
      });

      const currentEpIds = current.map(c => c.examination_pathology_id);
      const toAdd = epIds.filter(id => !currentEpIds.includes(id));
      const toRemove = current.filter(c => !epIds.includes(c.examination_pathology_id));

      // Mark removed as deleted
      for (const item of toRemove) {
        await sequelize.query(
          'UPDATE app_team_examination_pathology SET deleted = true WHERE id = :id',
          { replacements: { id: item.id }, transaction }
        );
      }

      // Add new (validated = false, pending admin validation)
      for (const epId of toAdd) {
        await sequelize.query(
          `INSERT INTO app_team_examination_pathology
           (id, team_id, examination_pathology_id, validated, deleted, insertion_date)
           VALUES (nextval('app_team_examination_pathology_id_seq'), :teamId, :epId, false, false, NOW())`,
          { replacements: { teamId: team.id, epId }, transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update team pathologies (mark as pending validation)
   * @param {number} userId - Business user ID
   * @param {number[]} epIds - ExaminationPathology IDs to set
   * @returns {Promise<void>}
   */
  async updateTeamPathologies(userId, epIds) {
    const team = await this.getBusinessTeam(userId);
    const transaction = await sequelize.transaction();

    try {
      // Get current pathologies
      const currentQuery = `
        SELECT id, examination_pathology_id
        FROM app_team_examination_pathology
        WHERE team_id = :teamId AND deleted = false
          AND examination_pathology_id IN (
            SELECT id FROM app_examination_pathology WHERE examination = false
          )
      `;
      const current = await sequelize.query(currentQuery, {
        replacements: { teamId: team.id },
        type: QueryTypes.SELECT,
        transaction
      });

      const currentEpIds = current.map(c => c.examination_pathology_id);
      const toAdd = epIds.filter(id => !currentEpIds.includes(id));
      const toRemove = current.filter(c => !epIds.includes(c.examination_pathology_id));

      // Mark removed as deleted
      for (const item of toRemove) {
        await sequelize.query(
          'UPDATE app_team_examination_pathology SET deleted = true WHERE id = :id',
          { replacements: { id: item.id }, transaction }
        );
      }

      // Add new (validated = false, pending admin validation)
      for (const epId of toAdd) {
        await sequelize.query(
          `INSERT INTO app_team_examination_pathology
           (id, team_id, examination_pathology_id, validated, deleted, insertion_date)
           VALUES (nextval('app_team_examination_pathology_id_seq'), :teamId, :epId, false, false, NOW())`,
          { replacements: { teamId: team.id, epId }, transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new BusinessService();
