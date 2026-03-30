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
        attributes: ['id', 'name', 'surname', 'email', 'username', 'agreeMarketing', 'agreeNewsletter']
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
}

module.exports = new AdminService();
