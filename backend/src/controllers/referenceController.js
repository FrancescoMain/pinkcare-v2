const typologyService = require('../services/typologyService');
const municipalityService = require('../services/municipalityService');

class ReferenceController {
  async getMedicalTitles(req, res, next) {
    try {
      const titles = await typologyService.getByPertinence('medical_title');
      res.json(titles.map(title => ({
        id: title.id,
        label: title.label
      })));
    } catch (error) {
      next(error);
    }
  }

  async searchMunicipalities(req, res, next) {
    try {
      const query = (req.query.q || req.query.query || '').trim();
      const results = await municipalityService.search(query);
      res.json(results.map(item => ({
        id: item.id,
        name: item.name,
        province: item.provincialCode,
        region: item.region,
        postCode: item.postCode
      })));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReferenceController();
