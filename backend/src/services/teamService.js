const { sequelize } = require('../config/database');
const { Team, Address, UserTeam, Typology } = require('../models');
const typologyService = require('./typologyService');

class TeamService {
  constructor() {
    this.allowedStreetTypes = [
      'Via', 'Piazza', 'Corso', 'Viale', 'Largo', 'Contrada', 'Vicolo',
      'Circonvallazione', 'Galleria', 'Parco', 'Rotonda', 'Traversa',
      'Lungomare', 'Strada', 'Stretto', 'SC', 'SP', 'SR', 'SS'
    ];
  }

  /**
   * Normalize street type keeping compatibility with legacy
   * @param {string} streetType
   * @returns {string|null}
   */
  normaliseStreetType(streetType) {
    if (!streetType) {
      return null;
    }
    const value = streetType.trim();
    if (!value) {
      return null;
    }
    if (this.allowedStreetTypes.includes(value)) {
      return value;
    }
    return value;
  }

  /**
   * Resolve typology id for doctor/clinic strings
   * @param {string} businessType
   * @returns {number}
   */
  resolveBusinessType(businessType) {
    if (!businessType) {
      throw new Error('Tipo struttura mancante');
    }
    const normalized = businessType.toUpperCase();
    if (normalized === 'DOCTOR') {
      return Typology.IDS.DOCTOR;
    }
    if (normalized === 'CLINIC') {
      return Typology.IDS.CLINIC;
    }
    throw new Error(`Tipo struttura non supportato: ${businessType}`);
  }

  /**
   * Create address row
   * @param {object} addressInput
   * @param {object} options
   * @returns {Promise<Address>}
   */
  async createAddress(addressInput, options = {}) {
    const addressPayload = {
      nation: addressInput.nation || 'IT',
      region: addressInput.region || null,
      province: addressInput.province || null,
      postCode: addressInput.postCode || null,
      municipality: addressInput.municipality || null,
      street: addressInput.street || null,
      streetType: this.normaliseStreetType(addressInput.streetType),
      streetNumber: addressInput.streetNumber || null,
      detail: addressInput.detail || null,
      latitude: addressInput.latitude || null,
      longitude: addressInput.longitude || null,
      note: addressInput.note || null,
      zone: addressInput.zone || null,
      at: addressInput.at || null,
      typologyString: addressInput.typologyString || null,
      deleted: false
    };

    return Address.create(addressPayload, options);
  }

  /**
   * Create team, associate representative and map to user
   * @param {object} params
   * @param {object} params.user - Representative user
   * @param {object} params.businessData - Domain data for team
   * @param {object} options - { transaction }
   * @returns {Promise<Team>}
   */
  async createBusinessTeam({ user, businessData }, options = {}) {
    const { transaction } = options;

    if (!user || !user.id) {
      throw new Error('Utente rappresentante non valido');
    }

    const teamTypeId = this.resolveBusinessType(businessData.businessType);
    const basicTitle = await typologyService.getBasicTitle();
    if (!basicTitle) {
      throw new Error('Tipologia BASIC non trovata');
    }

    // Rimuoviamo il campo id dall'address per permettere l'auto-increment
    const { id, ...addressDataWithoutId } = businessData.address || {};

    // Usa una query INSERT diretta con nextval per forzare l'auto-increment
    const [addressResult] = await sequelize.query(`
      INSERT INTO app_address (id, nation, province, post_code, municipality, street, street_type, street_number, deleted)
      VALUES (nextval('app_address_id_seq'), :nation, :province, :postCode, :municipality, :street, :streetType, :streetNumber, :deleted)
      RETURNING *
    `, {
      replacements: {
        nation: 'IT',
        province: addressDataWithoutId.province,
        postCode: addressDataWithoutId.postCode,
        municipality: addressDataWithoutId.municipality,
        street: addressDataWithoutId.street,
        streetType: addressDataWithoutId.streetType,
        streetNumber: addressDataWithoutId.streetNumber,
        deleted: false
      },
      type: sequelize.QueryTypes.INSERT,
      transaction
    });

    const address = addressResult[0];

    const isDoctor = teamTypeId === Typology.IDS.DOCTOR;
    const representativeName = `${user.name || ''} ${user.surname || ''}`.trim();

    const teamPayload = {
      active: 'Y',
      deleted: 'N',
      addressId: address.id,
      representativeId: user.id,
      typeId: teamTypeId,
      titleId: basicTitle.id,
      name: isDoctor ? representativeName || null : (businessData.name || null),
      medicalTitle: isDoctor ? businessData.medicalTitle || null : null,
      email: businessData.email || user.email,
      searchable: false,
      registrationCode: businessData.registrationCode || null,
      taxCode: businessData.taxCode || null,
      vatNumber: businessData.vatNumber || null,
      landlinePhone: businessData.landlinePhone || null,
      mobilePhone: businessData.mobilePhone || null,
      website: businessData.website || null,
      secondEmail: businessData.secondEmail || null,
    };

    // Use raw SQL to force PostgreSQL sequence usage for team creation
    const [teamResult] = await sequelize.query(`
      INSERT INTO app_team (
        id, active, deleted, insertion_date, last_modify_date, name, medical_title,
        email, searchable, registration_code, tax_code, vat_number, landline_phone,
        mobile_phone, website, second_email, address_id, representative_id, title_id, type_id
      ) VALUES (
        nextval('app_team_id_seq'), :active, :deleted, :insertionDate, :lastModifyDate,
        :name, :medicalTitle, :email, :searchable, :registrationCode, :taxCode,
        :vatNumber, :landlinePhone, :mobilePhone, :website, :secondEmail,
        :addressId, :representativeId, :titleId, :typeId
      ) RETURNING *
    `, {
      replacements: {
        active: teamPayload.active,
        deleted: teamPayload.deleted,
        insertionDate: new Date(),
        lastModifyDate: new Date(),
        name: teamPayload.name,
        medicalTitle: teamPayload.medicalTitle,
        email: teamPayload.email,
        searchable: teamPayload.searchable,
        registrationCode: teamPayload.registrationCode,
        taxCode: teamPayload.taxCode,
        vatNumber: teamPayload.vatNumber,
        landlinePhone: teamPayload.landlinePhone,
        mobilePhone: teamPayload.mobilePhone,
        website: teamPayload.website,
        secondEmail: teamPayload.secondEmail,
        addressId: teamPayload.addressId,
        representativeId: teamPayload.representativeId,
        titleId: teamPayload.titleId,
        typeId: teamPayload.typeId
      },
      type: sequelize.QueryTypes.INSERT,
      transaction
    });

    const team = teamResult[0];

    await UserTeam.create({
      userId: user.id,
      teamId: team.id
    }, { transaction });

    // Reload with associations similar to legacy eager loading
    return Team.findByPk(team.id, {
      include: [
        { association: 'address' },
        { association: 'representative' },
        { association: 'type' },
        { association: 'title' }
      ],
      transaction
    });
  }
}

module.exports = new TeamService();
