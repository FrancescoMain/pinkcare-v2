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

    const address = await this.createAddress(businessData.address || {}, { transaction });

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

    const team = await Team.create(teamPayload, { transaction });

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
