const { Op } = require('sequelize');
const { Municipality } = require('../models');

class MunicipalityService {
  /**
   * Autocomplete municipalities replicating legacy logic (name/province)
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Municipality[]>}
   */
  async search(query, limit = 15) {
    if (!query || query.length < 3) {
      return [];
    }

    return Municipality.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      },
      order: [
        ['name', 'ASC'],
        ['provincialCode', 'ASC']
      ],
      limit
    });
  }
}

module.exports = new MunicipalityService();
