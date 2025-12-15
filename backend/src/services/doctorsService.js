const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  Team,
  User,
  Address,
  Typology,
  ExaminationPathology,
  Municipality
} = require('../models');
const TeamExaminationPathology = require('../models/TeamExaminationPathology');

/**
 * Doctors Service
 * Handles doctors/clinics listing and search business logic
 */
class DoctorsService {

  /**
   * Type IDs from Typology
   */
  static TYPES = {
    DOCTOR: 3,
    CLINIC: 4
  };

  /**
   * Default pagination settings
   */
  static DEFAULT_PAGE_SIZE = 15;

  /**
   * Search doctors/clinics with filters and geo-spatial search
   * @param {Object} filters - Search filters
   * @param {number} filters.type - Type ID (3=DOCTOR, 4=CLINIC, null=both)
   * @param {number} filters.examination - Examination ID filter
   * @param {number} filters.pathology - Pathology ID filter
   * @param {number} filters.municipalityId - Municipality ID for geo-search
   * @param {string} filters.lat - Latitude for geo-search
   * @param {string} filters.lon - Longitude for geo-search
   * @param {number} filters.radius - Search radius in km (default: unlimited)
   * @param {string} filters.query - Text search on name/email
   * @param {number} page - Page number (1-based)
   * @param {number} size - Page size
   * @returns {Promise<Object>} Paginated results with doctors array and pagination info
   */
  async search(filters = {}, page = 1, size = DoctorsService.DEFAULT_PAGE_SIZE) {
    const { type, examination, pathology, municipalityId, lat, lon, radius, query } = filters;

    // Build base query conditions
    const whereConditions = [];
    const replacements = {};

    // Only searchable and active teams
    whereConditions.push("t.searchable = true");
    whereConditions.push("t.deleted = 'N'");
    whereConditions.push("t.active = 'Y'");

    // Filter by type (DOCTOR or CLINIC)
    if (type) {
      whereConditions.push("t.type_id = :typeId");
      replacements.typeId = type;
    } else {
      // Default: only doctors and clinics
      whereConditions.push("t.type_id IN (:doctorType, :clinicType)");
      replacements.doctorType = DoctorsService.TYPES.DOCTOR;
      replacements.clinicType = DoctorsService.TYPES.CLINIC;
    }

    // Filter by examination
    if (examination) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM app_team_examination_pathology tep
          JOIN app_examination_pathology ep ON ep.id = tep.examination_pathology_id
          WHERE tep.team_id = t.id
            AND tep.deleted = false
            AND ep.examination = true
            AND ep.id = :examinationId
        )
      `);
      replacements.examinationId = examination;
    }

    // Filter by pathology
    if (pathology) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM app_team_examination_pathology tep
          JOIN app_examination_pathology ep ON ep.id = tep.examination_pathology_id
          WHERE tep.team_id = t.id
            AND tep.deleted = false
            AND ep.examination = false
            AND ep.id = :pathologyId
        )
      `);
      replacements.pathologyId = pathology;
    }

    // Text search on name/email
    if (query) {
      whereConditions.push(`
        (
          LOWER(t.name) LIKE LOWER(:searchQuery)
          OR LOWER(u.name) LIKE LOWER(:searchQuery)
          OR LOWER(u.surname) LIKE LOWER(:searchQuery)
          OR LOWER(CONCAT(u.surname, ' ', u.name)) LIKE LOWER(:searchQuery)
          OR LOWER(t.email) LIKE LOWER(:searchQuery)
        )
      `);
      replacements.searchQuery = `%${query}%`;
    }

    // Geo-spatial search
    let distanceSelect = "NULL as distance";
    let distanceOrder = "t.name ASC";
    let hasGeoSearch = false;

    // Get coordinates from municipality if provided
    let searchLat = lat;
    let searchLon = lon;

    if (municipalityId && (!searchLat || !searchLon)) {
      const municipality = await Municipality.findByPk(municipalityId);
      if (municipality) {
        // Use municipality's own coordinates (lat/lng fields)
        if (municipality.lat && municipality.lng) {
          searchLat = municipality.lat;
          searchLon = municipality.lng;
        } else {
          // Fallback: try to get coordinates from an address in this municipality
          const addressWithCoords = await Address.findOne({
            where: {
              municipality: municipality.name,
              latitude: { [Op.ne]: null },
              longitude: { [Op.ne]: null }
            }
          });
          if (addressWithCoords) {
            searchLat = addressWithCoords.latitude;
            searchLon = addressWithCoords.longitude;
          }
        }
      }
    }

    if (searchLat && searchLon) {
      hasGeoSearch = true;
      // Haversine formula for distance calculation in kilometers
      distanceSelect = `
        (6371 * acos(
          cos(radians(:searchLat)) * cos(radians(CAST(a.latitude AS DOUBLE PRECISION))) *
          cos(radians(CAST(a.longitude AS DOUBLE PRECISION)) - radians(:searchLon)) +
          sin(radians(:searchLat)) * sin(radians(CAST(a.latitude AS DOUBLE PRECISION)))
        )) as distance
      `;
      replacements.searchLat = parseFloat(searchLat);
      replacements.searchLon = parseFloat(searchLon);

      // Filter by radius if provided
      if (radius) {
        whereConditions.push(`
          a.latitude IS NOT NULL AND a.longitude IS NOT NULL AND
          (6371 * acos(
            cos(radians(:searchLat)) * cos(radians(CAST(a.latitude AS DOUBLE PRECISION))) *
            cos(radians(CAST(a.longitude AS DOUBLE PRECISION)) - radians(:searchLon)) +
            sin(radians(:searchLat)) * sin(radians(CAST(a.latitude AS DOUBLE PRECISION)))
          )) <= :radius
        `);
        replacements.radius = radius;
      }

      distanceOrder = "distance ASC NULLS LAST";
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM app_team t
      LEFT JOIN app_user u ON t.representative_id = u.id
      LEFT JOIN app_address a ON t.address_id = a.id
      ${whereClause}
    `;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT
    });
    const total = parseInt(countResult.total, 10);

    // Calculate pagination
    const offset = (page - 1) * size;
    const totalPages = Math.ceil(total / size);

    // Main query with all data
    const mainQuery = `
      SELECT DISTINCT
        t.id,
        t.name as team_name,
        t.type_id,
        t.email,
        t.landline_phone,
        t.mobile_phone,
        t.website,
        t.logo,
        t.medical_title,
        t.description,
        t.medical_publications,
        t.linkshop,
        t.searchable,
        u.id as representative_id,
        u.name as rep_name,
        u.surname as rep_surname,
        u.email as rep_email,
        a.id as address_id,
        a.street_type,
        a.street,
        a.street_number,
        a.municipality,
        a.province,
        a.post_code,
        a.region,
        a.latitude,
        a.longitude,
        typ.label as type_label,
        ${distanceSelect}
      FROM app_team t
      LEFT JOIN app_user u ON t.representative_id = u.id
      LEFT JOIN app_address a ON t.address_id = a.id
      LEFT JOIN app_typology typ ON t.type_id = typ.id
      ${whereClause}
      ORDER BY ${distanceOrder}
      LIMIT :limit OFFSET :offset
    `;

    replacements.limit = size;
    replacements.offset = offset;

    const doctors = await sequelize.query(mainQuery, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Transform results
    const transformedDoctors = await Promise.all(
      doctors.map(async (doc) => this._transformDoctor(doc))
    );

    return {
      doctors: transformedDoctors,
      pagination: {
        page,
        size,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  /**
   * Get doctor/clinic by ID
   * @param {number} id - Team ID
   * @returns {Promise<Object>} Doctor details
   */
  async getById(id) {
    const query = `
      SELECT
        t.id,
        t.name as team_name,
        t.type_id,
        t.email,
        t.landline_phone,
        t.mobile_phone,
        t.fax,
        t.website,
        t.logo,
        t.medical_title,
        t.description,
        t.medical_publications,
        t.instrumentation,
        t.linkshop,
        t.registration_code,
        t.tax_code,
        t.vat_number,
        t.searchable,
        u.id as representative_id,
        u.name as rep_name,
        u.surname as rep_surname,
        u.email as rep_email,
        a.id as address_id,
        a.street,
        a.street_type,
        a.street_number,
        a.municipality,
        a.province,
        a.post_code,
        a.region,
        a.latitude,
        a.longitude,
        a.detail as address_detail,
        typ.label as type_label
      FROM app_team t
      LEFT JOIN app_user u ON t.representative_id = u.id
      LEFT JOIN app_address a ON t.address_id = a.id
      LEFT JOIN app_typology typ ON t.type_id = typ.id
      WHERE t.id = :id
        AND t.deleted = 'N'
        AND t.searchable = true
    `;

    const [doctor] = await sequelize.query(query, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!doctor) {
      throw new Error('Medico non trovato');
    }

    // Get examinations
    const examinations = await this._getTeamExaminations(id, true);

    // Get pathologies
    const pathologies = await this._getTeamExaminations(id, false);

    const transformed = await this._transformDoctor(doctor, true);
    transformed.examinations = examinations;
    transformed.pathologies = pathologies;

    return transformed;
  }

  /**
   * Get examinations or pathologies for a team
   * @private
   */
  async _getTeamExaminations(teamId, isExamination = true) {
    const query = `
      SELECT ep.id, ep.label
      FROM app_team_examination_pathology tep
      JOIN app_examination_pathology ep ON ep.id = tep.examination_pathology_id
      WHERE tep.team_id = :teamId
        AND tep.deleted = false
        AND ep.examination = :isExamination
      ORDER BY ep.label ASC
    `;

    return sequelize.query(query, {
      replacements: { teamId, isExamination },
      type: QueryTypes.SELECT
    });
  }

  /**
   * Get all examinations (for filter dropdown)
   * @returns {Promise<Array>} List of examinations
   */
  async getExaminations() {
    const examinations = await ExaminationPathology.findAll({
      where: { examination: true },
      attributes: ['id', 'label'],
      order: [['label', 'ASC']]
    });

    return examinations.map(e => ({
      id: e.id,
      label: e.label
    }));
  }

  /**
   * Get all pathologies (for filter dropdown)
   * @returns {Promise<Array>} List of pathologies
   */
  async getPathologies() {
    const pathologies = await ExaminationPathology.findAll({
      where: { examination: false },
      attributes: ['id', 'label'],
      order: [['label', 'ASC']]
    });

    return pathologies.map(p => ({
      id: p.id,
      label: p.label
    }));
  }

  /**
   * Autocomplete search for doctors by name
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Matching doctors
   */
  async autocomplete(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const sqlQuery = `
      SELECT DISTINCT
        t.id,
        t.name as team_name,
        t.type_id,
        u.name as rep_name,
        u.surname as rep_surname,
        typ.label as type_label,
        CASE WHEN t.type_id = :doctorType THEN COALESCE(u.surname, '') ELSE COALESCE(t.name, '') END as sort_name
      FROM app_team t
      LEFT JOIN app_user u ON t.representative_id = u.id
      LEFT JOIN app_typology typ ON t.type_id = typ.id
      WHERE t.deleted = 'N'
        AND t.searchable = true
        AND t.active = 'Y'
        AND t.type_id IN (:doctorType, :clinicType)
        AND (
          LOWER(t.name) LIKE LOWER(:searchQuery)
          OR LOWER(u.name) LIKE LOWER(:searchQuery)
          OR LOWER(u.surname) LIKE LOWER(:searchQuery)
          OR LOWER(CONCAT(u.surname, ' ', u.name)) LIKE LOWER(:searchQuery)
        )
      ORDER BY sort_name ASC
      LIMIT :limit
    `;

    const results = await sequelize.query(sqlQuery, {
      replacements: {
        searchQuery: `%${query}%`,
        doctorType: DoctorsService.TYPES.DOCTOR,
        clinicType: DoctorsService.TYPES.CLINIC,
        limit
      },
      type: QueryTypes.SELECT
    });

    return results.map(r => ({
      id: r.id,
      name: this._getDisplayName(r),
      type: r.type_label,
      typeId: r.type_id
    }));
  }

  /**
   * Get display name for doctor/clinic
   * @private
   */
  _getDisplayName(doc) {
    const typeId = parseInt(doc.type_id, 10);
    if (typeId === DoctorsService.TYPES.DOCTOR) {
      // For doctors, use representative name (nome + cognome come nel legacy)
      if (doc.rep_name && doc.rep_surname) {
        return `${doc.rep_name} ${doc.rep_surname}`;
      }
      if (doc.rep_name) {
        return doc.rep_name;
      }
      if (doc.rep_surname) {
        return doc.rep_surname;
      }
    }
    // For clinics or fallback, use team name
    return doc.team_name || 'N/A';
  }

  /**
   * Build full address string
   * @private
   */
  _buildFullAddress(doc) {
    const parts = [];

    if (doc.street_type) {
      parts.push(doc.street_type);
    }
    if (doc.street) {
      parts.push(doc.street);
    }
    if (doc.street_number) {
      parts.push(doc.street_number);
    }

    const streetPart = parts.join(' ');

    const locationParts = [];
    if (doc.post_code) {
      locationParts.push(doc.post_code);
    }
    if (doc.municipality) {
      locationParts.push(doc.municipality);
    }
    if (doc.province) {
      locationParts.push(`(${doc.province})`);
    }

    const locationPart = locationParts.join(' ');

    if (streetPart && locationPart) {
      return `${streetPart}, ${locationPart}`;
    }
    return streetPart || locationPart || null;
  }

  /**
   * Transform raw database row to API response
   * @private
   */
  async _transformDoctor(doc, detailed = false) {
    const typeId = parseInt(doc.type_id, 10);

    // Per medici e cliniche: usa rep_email come preferenza, poi team email come fallback
    // Nota: le email con suffisso _NOUSE sono disabilitate nel legacy
    const cleanEmail = (email) => {
      if (!email) return null;
      if (email.endsWith('_NOUSE')) return null;
      return email;
    };

    // Prima prova rep_email (sia per medici che cliniche), poi team email
    const displayEmail = cleanEmail(doc.rep_email) || cleanEmail(doc.email);

    const result = {
      id: doc.id,
      name: this._getDisplayName(doc),
      teamName: doc.team_name,
      type: doc.type_label || (typeId === DoctorsService.TYPES.DOCTOR ? 'Medico' : 'Clinica'),
      typeId: typeId,
      email: displayEmail,
      teamEmail: doc.email,
      phone: doc.landline_phone || doc.mobile_phone,
      mobilePhone: doc.mobile_phone,
      landlinePhone: doc.landline_phone,
      website: doc.website,
      logo: doc.logo,
      medicalTitle: doc.medical_title,
      description: doc.description,
      address: {
        full: this._buildFullAddress(doc),
        streetType: doc.street_type,
        street: doc.street,
        streetNumber: doc.street_number,
        municipality: doc.municipality,
        province: doc.province,
        postCode: doc.post_code,
        region: doc.region,
        latitude: doc.latitude,
        longitude: doc.longitude
      },
      distance: doc.distance ? parseFloat(doc.distance.toFixed(1)) : null,
      shopLink: doc.linkshop,
      representative: doc.representative_id ? {
        id: doc.representative_id,
        name: doc.rep_name,
        surname: doc.rep_surname,
        fullName: doc.rep_name && doc.rep_surname
          ? `${doc.rep_name} ${doc.rep_surname}`
          : (doc.rep_name || doc.rep_surname || null),
        email: doc.rep_email
      } : null
    };

    // Add detailed fields
    if (detailed) {
      result.medicalPublications = doc.medical_publications;
      result.instrumentation = doc.instrumentation;
      result.fax = doc.fax;
      result.registrationCode = doc.registration_code;
    }

    return result;
  }
}

module.exports = new DoctorsService();
