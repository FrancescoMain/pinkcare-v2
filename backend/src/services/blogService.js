const { Op, Sequelize } = require('sequelize');
const db = require('../models');

class BlogService {
  /**
   * Get all blog posts with filters and role-based access
   */
  async findPosts(filters = {}, userRole, userTeamId, userAgeRange, userPathologies, page = 0, limit = 20) {
    const where = { deleted: false };
    const include = [
      {
        model: db.Team,
        as: 'team',
        attributes: ['id', 'name', 'logo', 'type_id']
      },
      {
        model: db.BlogPostAgeRange,
        as: 'age_ranges',
        include: [{
          model: db.Protocol,
          as: 'age_range',
          attributes: ['id', 'age_range', 'inferior_limit', 'superior_limit']
        }]
      },
      {
        model: db.BlogPostCategory,
        as: 'categories',
        include: [{
          model: db.Typology,
          as: 'category',
          attributes: ['id', 'label']
        }]
      },
      {
        model: db.BlogPostThematicArea,
        as: 'thematic_areas',
        include: [{
          model: db.ThematicArea,
          as: 'thematic_area',
          attributes: ['id', 'label']
        }]
      },
      {
        model: db.BlogPostPathology,
        as: 'pathologies',
        include: [{
          model: db.ExaminationPathology,
          as: 'pathology',
          attributes: ['id', 'label']
        }]
      }
    ];

    // Role-based filtering
    if (userRole === 'ROLE_BUSINESS') {
      where.team_id = userTeamId;
      console.log('[BlogService] Filtering by team_id:', userTeamId);
    }

    // Text search
    if (filters.text) {
      where[Op.or] = [
        { headline: { [Op.iLike]: `%${filters.text}%` } },
        { text: { [Op.iLike]: `%${filters.text}%` } }
      ];
    }

    // Age range filter
    if (filters.ageRangeId) {
      include[1].where = { age_range_id: filters.ageRangeId };
      include[1].required = true;
    }

    // Category filter
    if (filters.categoryId) {
      include[2].where = { category_id: filters.categoryId };
      include[2].required = true;
    }

    // Thematic area filter
    if (filters.thematicAreaId) {
      include[3].where = { thematic_area_id: filters.thematicAreaId };
      include[3].required = true;
    }

    // Pathology filter
    if (filters.pathologyId) {
      include[4].where = { pathology_id: filters.pathologyId };
      include[4].required = true;
    }

    // Build order - special for CONSUMER
    let order = [['insertion_date', 'DESC']];

    if (userRole === 'ROLE_CONSUMER' && userAgeRange) {
      // Complex ordering for consumers based on relevance
      order = [
        // 1. Posts matching exact age range
        [
          Sequelize.literal(`COALESCE((
            SELECT COUNT(*) FROM app_blog_post_age_range bpar
            JOIN app_protocol p ON bpar.age_range_id = p.id
            WHERE bpar.blog_post_id = "BlogPost".id
            AND p.inferior_limit = ${userAgeRange.inferior_limit}
            AND p.superior_limit = ${userAgeRange.superior_limit}
          ) > 0, false)`),
          'DESC'
        ],
        // 2. Posts matching user pathologies (if any)
        ...(userPathologies && userPathologies.length > 0 ? [[
          Sequelize.literal(`COALESCE((
            SELECT COUNT(*) FROM app_blog_post_pathology bpp
            WHERE bpp.blog_post_id = "BlogPost".id
            AND bpp.pathology_id IN (${userPathologies.join(',')})
          ) > 0, false)`),
          'DESC'
        ]] : []),
        // 3. Posts for all age ranges
        [Sequelize.literal('COALESCE(all_age_ranges = true, false)'), 'DESC'],
        // 4. Posts for all pathologies
        [Sequelize.literal('COALESCE(all_pathologies = true, false)'), 'DESC'],
        // 5. Most recent first
        ['insertion_date', 'DESC']
      ];
    }

    console.log('[BlogService] Query where:', JSON.stringify(where));

    const { count, rows } = await db.BlogPost.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset: page * limit,
      distinct: true
    });

    console.log('[BlogService] Found', count, 'posts');

    return {
      posts: rows,
      totalCount: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Get public blog posts (publish_in_public = true)
   * Matches legacy flow: blogPostService.find(searchedPost, joinString, orderList, offset, limit)
   * where searchedPost.publish_in_public = true
   */
  async findPublicPosts(filters = {}, page = 0, limit = 15) {
    const where = { deleted: false, publish_in_public: true };
    const include = [
      {
        model: db.Team,
        as: 'team',
        attributes: ['id', 'name', 'logo', 'type_id']
      },
      {
        model: db.BlogPostAgeRange,
        as: 'age_ranges',
        include: [{
          model: db.Protocol,
          as: 'age_range',
          attributes: ['id', 'age_range', 'inferior_limit', 'superior_limit']
        }]
      },
      {
        model: db.BlogPostCategory,
        as: 'categories',
        include: [{
          model: db.Typology,
          as: 'category',
          attributes: ['id', 'label']
        }]
      },
      {
        model: db.BlogPostThematicArea,
        as: 'thematic_areas',
        include: [{
          model: db.ThematicArea,
          as: 'thematic_area',
          attributes: ['id', 'label']
        }]
      }
    ];

    // Age range filter
    if (filters.ageRangeId) {
      include[1].where = { age_range_id: filters.ageRangeId };
      include[1].required = true;
    }

    // Category filter
    if (filters.categoryId) {
      include[2].where = { category_id: filters.categoryId };
      include[2].required = true;
    }

    // Thematic area filter
    if (filters.thematicAreaId) {
      include[3].where = { thematic_area_id: filters.thematicAreaId };
      include[3].required = true;
    }

    const { count, rows } = await db.BlogPost.findAndCountAll({
      where,
      include,
      order: [['insertion_date', 'DESC']],
      limit,
      offset: page * limit,
      distinct: true
    });

    return {
      posts: rows,
      totalCount: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Get single blog post by ID
   */
  async getPost(id) {
    return await db.BlogPost.findByPk(id, {
      include: [
        {
          model: db.Team,
          as: 'team',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: db.BlogPostAgeRange,
          as: 'age_ranges',
          include: [{
            model: db.Protocol,
            as: 'age_range'
          }]
        },
        {
          model: db.BlogPostCategory,
          as: 'categories',
          include: [{
            model: db.Typology,
            as: 'category'
          }]
        },
        {
          model: db.BlogPostThematicArea,
          as: 'thematic_areas',
          include: [{
            model: db.ThematicArea,
            as: 'thematic_area'
          }]
        },
        {
          model: db.BlogPostPathology,
          as: 'pathologies',
          include: [{
            model: db.ExaminationPathology,
            as: 'pathology'
          }]
        }
      ]
    });
  }

  /**
   * Create new blog post
   */
  async createPost(postData, userId, userTeamId, userRole) {
    const transaction = await db.sequelize.transaction();

    try {
      // Auto-set insertion_username based on role
      if (!postData.insertion_username) {
        if (userRole === 'ROLE_PINKCARE') {
          postData.insertion_username = 'PINKCARE';
        } else if (userRole === 'ROLE_BUSINESS') {
          const user = await db.User.findByPk(userId);
          const team = await db.Team.findByPk(userTeamId, {
            include: [{ model: db.Typology, as: 'type' }]
          });

          if (team.type.id === 2) { // DOCTOR
            postData.insertion_username = `Dott. ${user.name} ${user.surname}`;
          } else if (team.type.id === 3) { // CLINIC
            postData.insertion_username = `Clinica ${team.name}`;
          }
        }
      }

      postData.team_id = userTeamId;

      // Extract arrays before creating post (they will be handled separately)
      const {
        age_ranges,
        categories,
        thematic_areas,
        pathologies,
        ...postDataWithoutArrays
      } = postData;

      // Get next id from sequence
      const [result] = await db.sequelize.query(
        "SELECT nextval('app_blog_post_id_seq') as id",
        { transaction }
      );
      postDataWithoutArrays.id = result[0].id;

      // Create the post
      const post = await db.BlogPost.create(postDataWithoutArrays, { transaction });

      // Save age ranges
      if (age_ranges && !postDataWithoutArrays.all_age_ranges) {
        for (const ageRangeId of age_ranges) {
          const [ageRangeResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_age_range_id_seq') as id",
            { transaction }
          );
          await db.BlogPostAgeRange.create({
            id: ageRangeResult[0].id,
            blog_post_id: post.id,
            age_range_id: ageRangeId
          }, { transaction });
        }
      }

      // Save categories
      if (categories && !postDataWithoutArrays.all_categories) {
        for (const categoryId of categories) {
          const [categoryResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_category_id_seq') as id",
            { transaction }
          );
          await db.BlogPostCategory.create({
            id: categoryResult[0].id,
            blog_post_id: post.id,
            category_id: categoryId
          }, { transaction });
        }
      }

      // Save thematic areas
      if (thematic_areas && !postDataWithoutArrays.all_thematic_areas) {
        for (const thematicAreaId of thematic_areas) {
          const [thematicAreaResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_thematic_area_id_seq') as id",
            { transaction }
          );
          await db.BlogPostThematicArea.create({
            id: thematicAreaResult[0].id,
            blog_post_id: post.id,
            thematic_area_id: thematicAreaId
          }, { transaction });
        }
      }

      // Save pathologies
      if (pathologies && !postDataWithoutArrays.all_pathologies) {
        for (const pathologyId of pathologies) {
          const [pathologyResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_pathology_id_seq') as id",
            { transaction }
          );
          await db.BlogPostPathology.create({
            id: pathologyResult[0].id,
            blog_post_id: post.id,
            pathology_id: pathologyId
          }, { transaction });
        }
      }

      await transaction.commit();
      return await this.getPost(post.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update blog post
   */
  async updatePost(id, postData, username) {
    const transaction = await db.sequelize.transaction();

    try {
      const post = await db.BlogPost.findByPk(id);
      if (!post) {
        throw new Error('Post not found');
      }

      postData.last_modify_username = username;
      await post.update(postData, { transaction });

      // Update age ranges
      await db.BlogPostAgeRange.destroy({
        where: { blog_post_id: id },
        transaction
      });
      if (postData.age_ranges && !postData.all_age_ranges) {
        for (const ageRangeId of postData.age_ranges) {
          const [ageRangeResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_age_range_id_seq') as id",
            { transaction }
          );
          await db.BlogPostAgeRange.create({
            id: ageRangeResult[0].id,
            blog_post_id: id,
            age_range_id: ageRangeId
          }, { transaction });
        }
      }

      // Update categories
      await db.BlogPostCategory.destroy({
        where: { blog_post_id: id },
        transaction
      });
      if (postData.categories && !postData.all_categories) {
        for (const categoryId of postData.categories) {
          const [categoryResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_category_id_seq') as id",
            { transaction }
          );
          await db.BlogPostCategory.create({
            id: categoryResult[0].id,
            blog_post_id: id,
            category_id: categoryId
          }, { transaction });
        }
      }

      // Update thematic areas
      await db.BlogPostThematicArea.destroy({
        where: { blog_post_id: id },
        transaction
      });
      if (postData.thematic_areas && !postData.all_thematic_areas) {
        for (const thematicAreaId of postData.thematic_areas) {
          const [thematicAreaResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_thematic_area_id_seq') as id",
            { transaction }
          );
          await db.BlogPostThematicArea.create({
            id: thematicAreaResult[0].id,
            blog_post_id: id,
            thematic_area_id: thematicAreaId
          }, { transaction });
        }
      }

      // Update pathologies
      await db.BlogPostPathology.destroy({
        where: { blog_post_id: id },
        transaction
      });
      if (postData.pathologies && !postData.all_pathologies) {
        for (const pathologyId of postData.pathologies) {
          const [pathologyResult] = await db.sequelize.query(
            "SELECT nextval('app_blog_post_pathology_id_seq') as id",
            { transaction }
          );
          await db.BlogPostPathology.create({
            id: pathologyResult[0].id,
            blog_post_id: id,
            pathology_id: pathologyId
          }, { transaction });
        }
      }

      await transaction.commit();
      return await this.getPost(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete blog post (soft delete)
   */
  async deletePost(id) {
    const post = await db.BlogPost.findByPk(id);
    if (!post) {
      throw new Error('Post not found');
    }
    return await post.update({ deleted: true });
  }

  /**
   * Get filter options
   */
  async getFilterOptions() {
    const [ageRanges, categories, thematicAreas, pathologies] = await Promise.all([
      db.Protocol.findAll({ order: [['inferior_limit', 'ASC']] }),
      db.Typology.findAll({
        where: { pertinence: 'blog_post_category' },
        order: [['label', 'ASC']]
      }),
      db.ThematicArea.findAll({ order: [['label', 'ASC']] }),
      db.ExaminationPathology.findAll({
        where: { examination: false },
        order: [['label', 'ASC']]
      })
    ]);

    return {
      ageRanges,
      categories,
      thematicAreas,
      pathologies
    };
  }
}

module.exports = new BlogService();
