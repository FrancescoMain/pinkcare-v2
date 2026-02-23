const { sequelize } = require('../config/database');
const examinationService = require('../services/examinationService');

/**
 * Dashboard Controller
 * Handles dashboard data retrieval - replicates home/flow.xml logic
 */
class DashboardController {

  /**
   * Get dashboard data for authenticated user
   * GET /api/dashboard
   */
  async getDashboardData(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user data
      const userQuery = `
        SELECT u.id, u.name, u.surname, u.email, u.filled_personal_form
        FROM app_user u
        WHERE u.id = $1
      `;

      const userResult = await sequelize.query(userQuery, {
        bind: [userId],
        type: sequelize.QueryTypes.SELECT
      });

      if (!userResult || userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult[0];

      // Get user's team and birthday from auth middleware
      const userTeamId = req.user.teams && req.user.teams.length > 0 ? req.user.teams[0].id : null;
      const birthday = req.user.birthday;
      console.log('[Dashboard] userId:', userId, 'userTeamId:', userTeamId);

      // Get recommended examinations (suggested screening)
      // Replicates legacy getTotalExaminations(userVO) - dynamic based on user's age/protocol/team
      let suggestedScreening = [];
      if (userTeamId) {
        suggestedScreening = await examinationService.getTotalExaminations(userTeamId, birthday);
      }

      // Get user's pathology IDs for blog filtering
      // Legacy: recommendedExaminationService.getUserPathologyIds(userVO.team)
      // Pathologies are entries in app_examination_pathology where examination = false
      let userPathologyIds = null;
      if (userTeamId) {
        const pathologyQuery = `
          SELECT DISTINCT re.examination_id as pathology_id
          FROM app_recommended_examination re
          INNER JOIN app_examination_pathology ep ON re.examination_id = ep.id
          WHERE re.team_id = $1 AND ep.examination = false
        `;
        const pathologies = await sequelize.query(pathologyQuery, {
          bind: [userTeamId],
          type: sequelize.QueryTypes.SELECT
        });
        userPathologyIds = pathologies.length > 0 ? pathologies.map(p => p.pathology_id) : null;
      }

      // Get blog posts
      // Replicates the complex ordering from flow.xml:
      // 1. Posts matching user's age range (highest priority)
      // 2. Posts matching user's pathologies
      // 3. Posts for all age ranges
      // 4. Posts for all pathologies
      // 5. Most recent first
      const blogPostQuery = `
        SELECT DISTINCT
          bp.id,
          bp.headline,
          SUBSTRING(bp.text, 1, 1000) as text,
          bp.image,
          bp.insertion_date,
          t.name as team_name,
          t.logo as team_logo,
          -- Priority scoring for ordering (matching legacy logic)
          CASE
            WHEN $1::bigint IS NOT NULL AND EXISTS (
              SELECT 1 FROM app_blog_post_age_range bpar
              WHERE bpar.blog_post_id = bp.id
              AND bpar.age_range_id = $1
            ) THEN 4
            WHEN bp.all_age_ranges = true THEN 3
            ELSE 0
          END +
          CASE
            WHEN $2::bigint[] IS NOT NULL AND EXISTS (
              SELECT 1 FROM app_blog_post_pathology bpp
              WHERE bpp.blog_post_id = bp.id
              AND bpp.pathology_id = ANY($2::bigint[])
            ) THEN 2
            WHEN bp.all_pathologies = true THEN 1
            ELSE 0
          END as priority_score
        FROM app_blog_post bp
        LEFT JOIN app_team t ON bp.team_id = t.id
        WHERE bp.deleted = false
          AND bp.publish_in_private = true
        ORDER BY priority_score DESC, bp.insertion_date DESC
        LIMIT 10
      `;

      const blogPosts = await sequelize.query(blogPostQuery, {
        bind: [null, userPathologyIds],
        type: sequelize.QueryTypes.SELECT
      });

      // Return dashboard data
      res.json({
        user: {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          filledPersonalForm: user.filled_personal_form
        },
        suggestedScreening: suggestedScreening.map(s => ({
          id: s.id || s.examinationId,
          examination: {
            id: s.examinationId,
            label: s.label
          }
        })),
        blogPosts: blogPosts.map(bp => ({
          id: bp.id,
          headline: bp.headline,
          text: bp.text,
          image: bp.image,
          insertionDate: bp.insertion_date,
          team: {
            name: bp.team_name,
            logo: bp.team_logo
          }
        }))
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      next(error);
    }
  }
}

module.exports = new DashboardController();
