const { Op } = require('sequelize');
const db = require('../models');

class AdminService {
  /**
   * Build the common include array for Team queries (representative, address, type)
   */
  _teamIncludes() {
    return [
      {
        model: db.User,
        as: 'representative',
        attributes: ['id', 'name', 'surname', 'email', 'username', 'agreeMarketing', 'agreeNewsletter', 'birthday', 'insertionDate', 'enabled']
      },
      {
        model: db.Address,
        as: 'address'
      },
      {
        model: db.Typology,
        as: 'type',
        attributes: ['id', 'label', 'pertinence']
      }
    ];
  }

  /**
   * Build where clause for representative name/surname search
   */
  _representativeWhere(name, surname) {
    const conditions = [];
    if (name) {
      conditions.push({ name: { [Op.iLike]: `%${name}%` } });
    }
    if (surname) {
      conditions.push({ surname: { [Op.iLike]: `%${surname}%` } });
    }
    return conditions.length > 0 ? { [Op.and]: conditions } : undefined;
  }

  /**
   * findConsumers — paginated search of Team records with typeId=CONSUMER
   */
  async findConsumers({ name, surname, page = 0, size = 20 } = {}) {
    const include = this._teamIncludes();

    const repWhere = this._representativeWhere(name, surname);
    if (repWhere) {
      include[0] = { ...include[0], where: repWhere, required: true };
    }

    const where = {
      typeId: db.Typology.IDS.CONSUMER
    };

    const { count, rows } = await db.Team.findAndCountAll({
      where,
      include,
      order: [['insertionDate', 'DESC']],
      limit: size,
      offset: page * size,
      distinct: true
    });

    const totalPages = Math.ceil(count / size);

    return {
      items: rows,
      total: count,
      page,
      size,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0
    };
  }

  /**
   * findBusinesses — paginated search of Team records for non-consumer/non-admin types
   */
  async findBusinesses({ name, surname, denomination, typeId, page = 0, size = 20 } = {}) {
    const include = this._teamIncludes();

    const repWhere = this._representativeWhere(name, surname);
    if (repWhere) {
      include[0] = { ...include[0], where: repWhere, required: true };
    }

    const where = {
      typeId: {
        [Op.notIn]: [db.Typology.IDS.CONSUMER, db.Typology.IDS.ADMINISTRATOR]
      }
    };

    if (denomination) {
      where.name = { [Op.iLike]: `%${denomination}%` };
    }

    if (typeId) {
      where.typeId = typeId;
    }

    const { count, rows } = await db.Team.findAndCountAll({
      where,
      include,
      order: [['insertionDate', 'DESC']],
      limit: size,
      offset: page * size,
      distinct: true
    });

    const totalPages = Math.ceil(count / size);

    return {
      items: rows,
      total: count,
      page,
      size,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0
    };
  }

  /**
   * toggleUserAccess — toggle User.enabled (CHAR 'Y'/'N' in DB)
   */
  async toggleUserAccess(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // enabled is not in the Sequelize model, use raw query
    const [result] = await db.sequelize.query(
      `UPDATE app_user
          SET enabled = CASE WHEN enabled = 'Y' THEN 'N' ELSE 'Y' END,
              last_modify_date = :lastModifyDate
        WHERE id = :userId
        RETURNING id, enabled`,
      {
        replacements: { userId, lastModifyDate: new Date() }
      }
    );

    return result[0];
  }

  /**
   * toggleUserMarketing — toggle User.agreeMarketing
   */
  async toggleUserMarketing(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    await user.update({
      agreeMarketing: !user.agreeMarketing,
      lastModifyDate: new Date()
    });

    return user;
  }

  /**
   * toggleUserNewsletter — toggle User.agreeNewsletter
   */
  async toggleUserNewsletter(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    await user.update({
      agreeNewsletter: !user.agreeNewsletter,
      lastModifyDate: new Date()
    });

    return user;
  }

  /**
   * toggleTeamSearchable — toggle Team.searchable
   */
  async toggleTeamSearchable(teamId) {
    const team = await db.Team.findByPk(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    await team.update({
      searchable: !team.searchable,
      lastModifyDate: new Date()
    });

    return team;
  }

  /**
   * exportConsumers — same query as findConsumers but no pagination
   */
  async exportConsumers({ name, surname } = {}) {
    const include = this._teamIncludes();

    const repWhere = this._representativeWhere(name, surname);
    if (repWhere) {
      include[0] = { ...include[0], where: repWhere, required: true };
    }

    const where = {
      typeId: db.Typology.IDS.CONSUMER
    };

    return await db.Team.findAll({
      where,
      include,
      order: [['insertionDate', 'DESC']]
    });
  }

  /**
   * exportBusinesses — same as findBusinesses but no pagination
   */
  async exportBusinesses({ name, surname, denomination, typeId } = {}) {
    const include = this._teamIncludes();

    const repWhere = this._representativeWhere(name, surname);
    if (repWhere) {
      include[0] = { ...include[0], where: repWhere, required: true };
    }

    const where = {
      typeId: {
        [Op.notIn]: [db.Typology.IDS.CONSUMER, db.Typology.IDS.ADMINISTRATOR]
      }
    };

    if (denomination) {
      where.name = { [Op.iLike]: `%${denomination}%` };
    }

    if (typeId) {
      where.typeId = typeId;
    }

    return await db.Team.findAll({
      where,
      include,
      order: [['insertionDate', 'DESC']]
    });
  }

  /**
   * getBusinessTypologies — return Typology records where pertinence='team', deleted=false,
   * excluding CONSUMER and ADMINISTRATOR IDs
   */
  async getBusinessTypologies() {
    return await db.Typology.findAll({
      where: {
        pertinence: db.Typology.PERTINENCE.TEAM,
        deleted: false,
        id: {
          [Op.notIn]: [db.Typology.IDS.CONSUMER, db.Typology.IDS.ADMINISTRATOR]
        }
      },
      order: [['label', 'ASC']]
    });
  }

  /**
   * findCollaborators — paginated list of users with admin/pinkcare roles
   * Queries users that belong to a Team with typeId = ADMINISTRATOR
   */
  async findCollaborators({ page = 0, size = 15 } = {}) {
    const { count, rows } = await db.User.findAndCountAll({
      include: [
        {
          model: db.Team,
          as: 'teams',
          where: {
            typeId: db.Typology.IDS.ADMINISTRATOR
          },
          attributes: ['id'],
          through: { attributes: [] }
        }
      ],
      attributes: ['id', 'name', 'surname', 'username', 'insertionDate'],
      order: [['insertionDate', 'DESC']],
      limit: size,
      offset: page * size,
      distinct: true
    });

    const totalPages = Math.ceil(count / size);

    return {
      items: rows,
      total: count,
      page,
      size,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0
    };
  }

  /**
   * createCollaborator — create a new collaborator user and assign to admin team
   */
  async createCollaborator({ name, surname, email, password }) {
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      name,
      surname,
      email,
      username: email,
      password: hashedPassword,
      insertionDate: new Date(),
      lastModifyDate: new Date()
    });

    // Associate with administrator team
    const adminTeam = await db.Team.findOne({
      where: { typeId: db.Typology.IDS.ADMINISTRATOR }
    });
    if (adminTeam) {
      await db.sequelize.query(
        `INSERT INTO app_user_app_team (users_id, teams_id) VALUES (:userId, :teamId)`,
        { replacements: { userId: user.id, teamId: adminTeam.id } }
      );
    }

    // Assign ROLE_PINKCARE
    const pinkRole = await db.Role.findOne({ where: { name: 'ROLE_PINKCARE' } });
    if (pinkRole) {
      await db.sequelize.query(
        `INSERT INTO app_user_app_role (user_id, role_id) VALUES (:userId, :roleId)`,
        { replacements: { userId: user.id, roleId: pinkRole.id } }
      );
    }

    return user;
  }

  /**
   * updateCollaborator — update name, surname, email of a collaborator
   */
  async updateCollaborator(userId, { name, surname, email }) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const updateData = { lastModifyDate: new Date() };
    if (name !== undefined) updateData.name = name;
    if (surname !== undefined) updateData.surname = surname;
    if (email !== undefined) {
      updateData.email = email;
      updateData.username = email;
    }

    await user.update(updateData);
    return user;
  }

  /**
   * deleteCollaborator — delete (disable) a collaborator user
   */
  async deleteCollaborator(userId) {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    await db.sequelize.query(
      `UPDATE app_user
         SET enabled = 'N',
             last_modify_date = :lastModifyDate
       WHERE id = :userId`,
      {
        replacements: { userId, lastModifyDate: new Date() }
      }
    );

    return { success: true };
  }

  /**
   * getCollaboratorRoles — get roles assigned to a user (level=3 only) with permissions
   */
  async getCollaboratorRoles(userId) {
    const [rows] = await db.sequelize.query(
      `SELECT r.id, r.description, r.name,
              uar.insertion, uar.modification, uar.cancellation
         FROM app_role r
         JOIN app_user_app_role uar ON uar.role_id = r.id
        WHERE uar.user_id = :userId
          AND r.level = 3
        ORDER BY r.description ASC`,
      { replacements: { userId } }
    );
    return rows;
  }

  /**
   * getAssignableRoles — get available roles (level=3, visible=true) NOT already assigned to user
   */
  async getAssignableRoles(userId) {
    const [rows] = await db.sequelize.query(
      `SELECT r.id, r.description, r.name
         FROM app_role r
        WHERE r.level = 3
          AND r.visible = true
          AND r.id NOT IN (
            SELECT uar.role_id FROM app_user_app_role uar WHERE uar.user_id = :userId
          )
        ORDER BY r.description ASC`,
      { replacements: { userId } }
    );
    return rows;
  }

  /**
   * addRoleToUser — insert into app_user_app_role with default permissions
   */
  async addRoleToUser(userId, roleId) {
    await db.sequelize.query(
      `INSERT INTO app_user_app_role (user_id, role_id, insertion, modification, cancellation)
       VALUES (:userId, :roleId, true, false, false)`,
      { replacements: { userId, roleId } }
    );
    return { success: true };
  }

  /**
   * updateUserRolePermissions — update permissions for a user-role assignment
   */
  async updateUserRolePermissions(userId, roleId, { insertion, modification, cancellation }) {
    await db.sequelize.query(
      `UPDATE app_user_app_role
          SET insertion = :insertion,
              modification = :modification,
              cancellation = :cancellation
        WHERE user_id = :userId AND role_id = :roleId`,
      { replacements: { userId, roleId, insertion, modification, cancellation } }
    );
    return { success: true };
  }

  /**
   * removeRoleFromUser — delete from app_user_app_role
   */
  async removeRoleFromUser(userId, roleId) {
    await db.sequelize.query(
      `DELETE FROM app_user_app_role WHERE user_id = :userId AND role_id = :roleId`,
      { replacements: { userId, roleId } }
    );
    return { success: true };
  }

  /**
   * findBlogCategories — return Typology records where pertinence='blog_post_category', deleted=false
   */
  async findBlogCategories() {
    return await db.Typology.findAll({
      where: {
        pertinence: 'blog_post_category',
        deleted: false
      },
      order: [['label', 'ASC']]
    });
  }

  /**
   * createBlogCategory — create a new blog category typology
   */
  async createBlogCategory(label) {
    return await db.Typology.create({
      label,
      pertinence: 'blog_post_category',
      business: false,
      deleted: false
    });
  }

  /**
   * updateBlogCategory — update a blog category label
   */
  async updateBlogCategory(id, label) {
    const typology = await db.Typology.findByPk(id);
    if (!typology) {
      throw new Error(`Typology not found: ${id}`);
    }
    await typology.update({ label });
    return typology;
  }

  /**
   * deleteBlogCategory — soft delete a blog category
   */
  async deleteBlogCategory(id) {
    const typology = await db.Typology.findByPk(id);
    if (!typology) {
      throw new Error(`Typology not found: ${id}`);
    }
    await typology.update({ deleted: true });
    return { success: true };
  }

  /**
   * findExaminations — paginated list from app_examination_pathology WHERE examination=true
   */
  async findExaminations({ page = 0, size = 15 } = {}) {
    const [[{ count }]] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM app_examination_pathology
       WHERE examination = true AND deleted = false`
    );
    const total = parseInt(count);
    const totalPages = Math.ceil(total / size);

    const [rows] = await db.sequelize.query(
      `SELECT id, label, periodical_control_days as "periodicalControlDays"
         FROM app_examination_pathology
        WHERE examination = true AND deleted = false
        ORDER BY label ASC
        LIMIT :size OFFSET :offset`,
      { replacements: { size, offset: page * size } }
    );

    return {
      items: rows,
      total,
      page,
      size,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0
    };
  }

  /**
   * findPathologies — paginated list from app_examination_pathology WHERE examination=false
   */
  async findPathologies({ page = 0, size = 15 } = {}) {
    const [[{ count }]] = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM app_examination_pathology
       WHERE examination = false AND deleted = false`
    );
    const total = parseInt(count);
    const totalPages = Math.ceil(total / size);

    const [rows] = await db.sequelize.query(
      `SELECT id, label
         FROM app_examination_pathology
        WHERE examination = false AND deleted = false
        ORDER BY label ASC
        LIMIT :size OFFSET :offset`,
      { replacements: { size, offset: page * size } }
    );

    return {
      items: rows,
      total,
      page,
      size,
      totalPages,
      hasNext: page < totalPages - 1,
      hasPrevious: page > 0
    };
  }

  /**
   * createExamination — INSERT into app_examination_pathology with examination=true
   */
  async createExamination(label, periodicalControlDays) {
    const [rows] = await db.sequelize.query(
      `INSERT INTO app_examination_pathology (label, examination, periodical_control_days, deleted, insertion_date, insertion_username)
       VALUES (:label, true, :periodicalControlDays, false, :now, :username)
       RETURNING id, label, periodical_control_days as "periodicalControlDays"`,
      {
        replacements: {
          label,
          periodicalControlDays: periodicalControlDays || null,
          now: new Date(),
          username: 'admin'
        }
      }
    );
    return rows[0];
  }

  /**
   * createPathology — INSERT into app_examination_pathology with examination=false
   */
  async createPathology(label) {
    const [rows] = await db.sequelize.query(
      `INSERT INTO app_examination_pathology (label, examination, deleted, insertion_date, insertion_username)
       VALUES (:label, false, false, :now, :username)
       RETURNING id, label`,
      {
        replacements: {
          label,
          now: new Date(),
          username: 'admin'
        }
      }
    );
    return rows[0];
  }

  /**
   * updateExamination — UPDATE label and periodical_control_days
   */
  async updateExamination(id, label, periodicalControlDays) {
    const [rows] = await db.sequelize.query(
      `UPDATE app_examination_pathology
          SET label = :label,
              periodical_control_days = :periodicalControlDays,
              last_modify_date = :now,
              last_modify_username = :username
        WHERE id = :id
        RETURNING id, label, periodical_control_days as "periodicalControlDays"`,
      {
        replacements: {
          id,
          label,
          periodicalControlDays: periodicalControlDays || null,
          now: new Date(),
          username: 'admin'
        }
      }
    );
    if (!rows.length) throw new Error(`ExaminationPathology not found: ${id}`);
    return rows[0];
  }

  /**
   * updatePathology — UPDATE label only
   */
  async updatePathology(id, label) {
    const [rows] = await db.sequelize.query(
      `UPDATE app_examination_pathology
          SET label = :label,
              last_modify_date = :now,
              last_modify_username = :username
        WHERE id = :id
        RETURNING id, label`,
      {
        replacements: {
          id,
          label,
          now: new Date(),
          username: 'admin'
        }
      }
    );
    if (!rows.length) throw new Error(`ExaminationPathology not found: ${id}`);
    return rows[0];
  }

  /**
   * deleteExamPathology — soft delete (set deleted=true)
   */
  async deleteExamPathology(id) {
    await db.sequelize.query(
      `UPDATE app_examination_pathology
          SET deleted = true,
              last_modify_date = :now,
              last_modify_username = :username
        WHERE id = :id`,
      {
        replacements: {
          id,
          now: new Date(),
          username: 'admin'
        }
      }
    );
    return { success: true };
  }
}

module.exports = new AdminService();
