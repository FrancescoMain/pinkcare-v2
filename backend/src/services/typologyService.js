const { Typology } = require('../models');

class TypologyService {
  /**
   * Find typologies by pertinence ordered by label
   * @param {string} pertinence
   * @returns {Promise<Typology[]>}
   */
  async getByPertinence(pertinence) {
    return Typology.findAll({
      where: {
        pertinence,
        deleted: false
      },
      order: [['label', 'ASC']]
    });
  }

  /**
   * Find typology by id
   * @param {number} id
   * @returns {Promise<Typology|null>}
   */
  async getById(id) {
    return Typology.findByPk(id);
  }

  /**
   * Retrieve typology by label/pertinence pair
   * @param {string} label
   * @param {string} pertinence
   * @returns {Promise<Typology|null>}
   */
  async getByLabel(label, pertinence) {
    return Typology.findOne({
      where: {
        label,
        pertinence,
        deleted: false
      }
    });
  }

  /**
   * Returns BASIC title typology (id = -1 in legacy)
   * @returns {Promise<Typology|null>}
   */
  async getBasicTitle() {
    const basicId = Typology.IDS.BASIC;
    const basic = await this.getById(basicId);
    if (basic) {
      return basic;
    }
    return this.getByLabel('Basic', Typology.PERTINENCE.TITLE);
  }
}

module.exports = new TypologyService();
