const adminService = require('../services/adminService');
const businessService = require('../services/businessService');
const notificationService = require('../services/notificationService');

class AdminController {
  /**
   * GET /api/admin/consumers
   * Get paginated list of consumers with optional filters
   */
  async getConsumers(req, res) {
    try {
      const { name, surname, page = 1, size = 20 } = req.query;
      const pageInt = Math.max(0, parseInt(page) - 1); // frontend sends 1-based, service uses 0-based
      const data = await adminService.findConsumers({
        name,
        surname,
        page: pageInt,
        size: parseInt(size)
      });
      data.page = data.page + 1; // convert back to 1-based for frontend
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
      const { name, surname, denomination, typeId, page = 1, size = 20 } = req.query;
      const pageInt = Math.max(0, parseInt(page) - 1); // frontend sends 1-based, service uses 0-based
      const data = await adminService.findBusinesses({
        name,
        surname,
        denomination,
        typeId: typeId ? parseInt(typeId) : undefined,
        page: pageInt,
        size: parseInt(size)
      });
      data.page = data.page + 1; // convert back to 1-based for frontend
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

  /**
   * GET /api/admin/collaborators
   * Get paginated list of collaborator users (admin/pinkcare roles)
   */
  async getCollaborators(req, res) {
    try {
      const { page = 1, size = 15 } = req.query;
      const pageInt = Math.max(0, parseInt(page) - 1);
      const data = await adminService.findCollaborators({
        page: pageInt,
        size: parseInt(size)
      });
      data.page = data.page + 1;
      res.json(data);
    } catch (error) {
      console.error('Error getting collaborators:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/collaborators
   * Create a new collaborator
   */
  async createCollaborator(req, res) {
    try {
      const { name, surname, email, password } = req.body;
      if (!name || !surname || !email || !password) {
        return res.status(400).json({ error: 'Nome, Cognome, Email e Password sono obbligatori' });
      }
      const data = await adminService.createCollaborator({ name, surname, email, password });
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating collaborator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/collaborators/:userId
   * Update a collaborator
   */
  async updateCollaborator(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const { name, surname, email } = req.body;
      const data = await adminService.updateCollaborator(userId, { name, surname, email });
      res.json(data);
    } catch (error) {
      console.error('Error updating collaborator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/collaborators/:userId
   * Delete a collaborator user
   */
  async deleteCollaborator(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      await adminService.deleteCollaborator(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/collaborators/:userId/roles
   * Get roles assigned to a collaborator
   */
  async getCollaboratorRoles(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const data = await adminService.getCollaboratorRoles(userId);
      res.json(data);
    } catch (error) {
      console.error('Error getting collaborator roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/collaborators/:userId/assignable-roles
   * Get roles that can be assigned to a collaborator
   */
  async getAssignableRoles(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const data = await adminService.getAssignableRoles(userId);
      res.json(data);
    } catch (error) {
      console.error('Error getting assignable roles:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/collaborators/:userId/roles
   * Add a role to a collaborator
   */
  async addRoleToUser(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;
      if (!roleId) {
        return res.status(400).json({ error: 'roleId is required' });
      }
      const data = await adminService.addRoleToUser(userId, parseInt(roleId));
      res.status(201).json(data);
    } catch (error) {
      console.error('Error adding role to user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/collaborators/:userId/roles/:roleId
   * Update permissions for a user-role assignment
   */
  async updateUserRolePermissions(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      const { insertion, modification, cancellation } = req.body;
      const data = await adminService.updateUserRolePermissions(userId, roleId, {
        insertion, modification, cancellation
      });
      res.json(data);
    } catch (error) {
      console.error('Error updating user role permissions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/collaborators/:userId/roles/:roleId
   * Remove a role from a collaborator
   */
  async removeRoleFromUser(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      const data = await adminService.removeRoleFromUser(userId, roleId);
      res.json(data);
    } catch (error) {
      console.error('Error removing role from user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/blog-categories
   * Get all blog categories
   */
  async getBlogCategories(req, res) {
    try {
      const data = await adminService.findBlogCategories();
      res.json(data);
    } catch (error) {
      console.error('Error getting blog categories:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/blog-categories
   * Create a new blog category
   */
  async createBlogCategory(req, res) {
    try {
      const { label } = req.body;
      if (!label) {
        return res.status(400).json({ error: 'Label is required' });
      }
      const data = await adminService.createBlogCategory(label);
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating blog category:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/blog-categories/:id
   * Update a blog category
   */
  async updateBlogCategory(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { label } = req.body;
      if (!label) {
        return res.status(400).json({ error: 'Label is required' });
      }
      const data = await adminService.updateBlogCategory(id, label);
      res.json(data);
    } catch (error) {
      console.error('Error updating blog category:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/blog-categories/:id
   * Delete a blog category (soft delete)
   */
  async deleteBlogCategory(req, res) {
    try {
      const id = parseInt(req.params.id);
      await adminService.deleteBlogCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/examinations
   * Get paginated list of examinations
   */
  async getExaminations(req, res) {
    try {
      const { page = 1, size = 15 } = req.query;
      const pageInt = Math.max(0, parseInt(page) - 1);
      const data = await adminService.findExaminations({
        page: pageInt,
        size: parseInt(size)
      });
      data.page = data.page + 1;
      res.json(data);
    } catch (error) {
      console.error('Error getting examinations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/examinations
   * Create a new examination
   */
  async createExamination(req, res) {
    try {
      const { label, periodicalControlDays } = req.body;
      if (!label) {
        return res.status(400).json({ error: 'Label is required' });
      }
      const data = await adminService.createExamination(label, periodicalControlDays);
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating examination:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/examinations/:id
   * Update an examination
   */
  async updateExamination(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { label, periodicalControlDays } = req.body;
      if (!label) {
        return res.status(400).json({ error: 'Label is required' });
      }
      const data = await adminService.updateExamination(id, label, periodicalControlDays);
      res.json(data);
    } catch (error) {
      console.error('Error updating examination:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/examinations/:id
   * Soft delete an examination
   */
  async deleteExamination(req, res) {
    try {
      const id = parseInt(req.params.id);
      await adminService.deleteExamPathology(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting examination:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/pathologies
   * Get paginated list of pathologies
   */
  async getPathologies(req, res) {
    try {
      const { page = 1, size = 15 } = req.query;
      const pageInt = Math.max(0, parseInt(page) - 1);
      const data = await adminService.findPathologies({
        page: pageInt,
        size: parseInt(size)
      });
      data.page = data.page + 1;
      res.json(data);
    } catch (error) {
      console.error('Error getting pathologies:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/admin/pathologies
   * Create a new pathology
   */
  async createPathology(req, res) {
    try {
      const { label } = req.body;
      if (!label) {
        return res.status(400).json({ error: 'Label is required' });
      }
      const data = await adminService.createPathology(label);
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating pathology:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/pathologies/:id
   * Update a pathology
   */
  async updatePathology(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { label } = req.body;
      if (!label) {
        return res.status(400).json({ error: 'Label is required' });
      }
      const data = await adminService.updatePathology(id, label);
      res.json(data);
    } catch (error) {
      console.error('Error updating pathology:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/pathologies/:id
   * Soft delete a pathology
   */
  async deletePathology(req, res) {
    try {
      const id = parseInt(req.params.id);
      await adminService.deleteExamPathology(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pathology:', error);
      res.status(500).json({ error: error.message });
    }
  }
  /**
   * GET /api/admin/businesses/:teamId/profile
   * Get a business profile by team ID (for admin viewing/approval)
   */
  async getBusinessProfile(req, res) {
    try {
      const teamId = parseInt(req.params.teamId);
      const profile = await businessService.getBusinessProfileByTeamId(teamId);
      res.json(profile);
    } catch (error) {
      console.error('Error getting business profile:', error);
      res.status(error.message === 'Team non trovato' ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/businesses/:teamId/approve-field
   * Approve a pending field change (copy _to_validate to base, clear _to_validate)
   */
  async approveField(req, res) {
    try {
      const teamId = parseInt(req.params.teamId);
      const { field } = req.body;
      if (!field) return res.status(400).json({ error: 'field is required' });

      await businessService.approveField(teamId, field);

      // Get team representative to send notification
      const { sequelize: sq } = require('../config/database');
      const { QueryTypes } = require('sequelize');
      const [team] = await sq.query(
        'SELECT representative_id FROM app_team WHERE id = :teamId',
        { replacements: { teamId }, type: QueryTypes.SELECT }
      );
      if (team?.representative_id) {
        try {
          await notificationService.sendBusinessChangesNotification(
            team.representative_id, teamId, null, `- ${field}`, null
          );
        } catch (e) { console.error('Notification error:', e); }
      }

      res.json({ success: true, field });
    } catch (error) {
      console.error('Error approving field:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/businesses/:teamId/reject-field
   * Reject a pending field change (clear _to_validate without copying)
   */
  async rejectField(req, res) {
    try {
      const teamId = parseInt(req.params.teamId);
      const { field } = req.body;
      if (!field) return res.status(400).json({ error: 'field is required' });

      await businessService.rejectField(teamId, field);

      const { sequelize: sq } = require('../config/database');
      const { QueryTypes } = require('sequelize');
      const [team] = await sq.query(
        'SELECT representative_id FROM app_team WHERE id = :teamId',
        { replacements: { teamId }, type: QueryTypes.SELECT }
      );
      if (team?.representative_id) {
        try {
          await notificationService.sendBusinessChangesNotification(
            team.representative_id, teamId, null, null, `- ${field}`
          );
        } catch (e) { console.error('Notification error:', e); }
      }

      res.json({ success: true, field });
    } catch (error) {
      console.error('Error rejecting field:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/businesses/:teamId/validate-exam-pathology/:tepId
   * Approve a pending team examination/pathology
   */
  async validateExamPathology(req, res) {
    try {
      const tepId = parseInt(req.params.tepId);
      await businessService.validateTeamExamPathology(tepId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error validating exam/pathology:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/admin/businesses/:teamId/reject-exam-pathology/:tepId
   * Reject a pending team examination/pathology
   */
  async rejectExamPathology(req, res) {
    try {
      const tepId = parseInt(req.params.tepId);
      await businessService.rejectTeamExamPathology(tepId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error rejecting exam/pathology:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AdminController();
