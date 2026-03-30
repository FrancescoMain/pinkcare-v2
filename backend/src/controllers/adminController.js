const adminService = require('../services/adminService');

class AdminController {
  /**
   * GET /api/admin/consumers
   * Get paginated list of consumers with optional filters
   */
  async getConsumers(req, res) {
    try {
      const { name, surname, page = 0, size = 20 } = req.query;
      const data = await adminService.findConsumers({
        name,
        surname,
        page: parseInt(page),
        size: parseInt(size)
      });
      res.json(data);
    } catch (error) {
      console.error('Error getting consumers:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/businesses
   * Get paginated list of businesses with optional filters
   */
  async getBusinesses(req, res) {
    try {
      const { name, surname, denomination, typeId, page = 0, size = 20 } = req.query;
      const data = await adminService.findBusinesses({
        name,
        surname,
        denomination,
        typeId: typeId ? parseInt(typeId) : undefined,
        page: parseInt(page),
        size: parseInt(size)
      });
      res.json(data);
    } catch (error) {
      console.error('Error getting businesses:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/users/:userId/toggle-access
   * Toggle user access (enabled/disabled)
   */
  async toggleAccess(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const data = await adminService.toggleUserAccess(userId);
      res.json(data);
    } catch (error) {
      console.error('Error toggling user access:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/users/:userId/toggle-marketing
   * Toggle user marketing consent
   */
  async toggleMarketing(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const data = await adminService.toggleUserMarketing(userId);
      res.json(data);
    } catch (error) {
      console.error('Error toggling user marketing:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/users/:userId/toggle-newsletter
   * Toggle user newsletter consent
   */
  async toggleNewsletter(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const data = await adminService.toggleUserNewsletter(userId);
      res.json(data);
    } catch (error) {
      console.error('Error toggling user newsletter:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/teams/:teamId/toggle-searchable
   * Toggle team searchable flag
   */
  async toggleSearchable(req, res) {
    try {
      const teamId = parseInt(req.params.teamId);
      const data = await adminService.toggleTeamSearchable(teamId);
      res.json(data);
    } catch (error) {
      console.error('Error toggling team searchable:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/consumers/export
   * Export consumers as CSV with BOM, semicolon-separated, Italian date format
   */
  async exportConsumers(req, res) {
    try {
      const { name, surname } = req.query;
      const rows = await adminService.exportConsumers({ name, surname });

      const header = 'Data Inserimento;Nome;Cognome;Email;Accesso;Marketing;Newsletter';
      const lines = rows.map(team => {
        const rep = team.representative || {};
        const date = team.insertionDate
          ? new Date(team.insertionDate).toLocaleDateString('it-IT')
          : '';
        const nome = rep.name || '';
        const cognome = rep.surname || '';
        const email = rep.email || '';
        const accesso = rep.username ? 'SI' : 'NO';
        const marketing = rep.agreeMarketing ? 'SI' : 'NO';
        const newsletter = rep.agreeNewsletter ? 'SI' : 'NO';
        return `${date};${nome};${cognome};${email};${accesso};${marketing};${newsletter}`;
      });

      const csv = '\uFEFF' + [header, ...lines].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="consumers.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting consumers:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/businesses/export
   * Export businesses as CSV with BOM, semicolon-separated, Italian date format
   */
  async exportBusinesses(req, res) {
    try {
      const { name, surname, denomination, typeId } = req.query;
      const rows = await adminService.exportBusinesses({
        name,
        surname,
        denomination,
        typeId: typeId ? parseInt(typeId) : undefined
      });

      const header = 'Data Inserimento;Tipologia;Denominazione;Nome Contatto;Cognome Contatto;Email;Accesso;Attivo';
      const lines = rows.map(team => {
        const rep = team.representative || {};
        const type = team.type || {};
        const date = team.insertionDate
          ? new Date(team.insertionDate).toLocaleDateString('it-IT')
          : '';
        const tipologia = type.label || '';
        const denominazione = team.name || '';
        const nomeContatto = rep.name || '';
        const cognomeContatto = rep.surname || '';
        const email = rep.email || '';
        const accesso = rep.username ? 'SI' : 'NO';
        const attivo = team.searchable ? 'SI' : 'NO';
        return `${date};${tipologia};${denominazione};${nomeContatto};${cognomeContatto};${email};${accesso};${attivo}`;
      });

      const csv = '\uFEFF' + [header, ...lines].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="businesses.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting businesses:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/typologies
   * Get business typologies
   */
  async getTypologies(req, res) {
    try {
      const data = await adminService.getBusinessTypologies();
      res.json(data);
    } catch (error) {
      console.error('Error getting typologies:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();
