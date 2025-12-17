const { sequelize } = require('../config/database');

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

      // Get user's team_id from app_user_app_team
      const userTeamQuery = `
        SELECT teams_id as team_id
        FROM app_user_app_team
        WHERE app_user_id = $1
        LIMIT 1
      `;
      const userTeamResult = await sequelize.query(userTeamQuery, {
        bind: [userId],
        type: sequelize.QueryTypes.SELECT
      });
      const userTeamId = userTeamResult && userTeamResult.length > 0 ? userTeamResult[0].team_id : null;
      console.log('[Dashboard] userId:', userId, 'userTeamId:', userTeamId);

      // Get protocol separately (age range) - may not exist for all users
      let protocol = null;
      if (userTeamId) {
        const protocolQuery = `
          SELECT p.id, p.inferior_limit, p.superior_limit
          FROM app_protocol p
          INNER JOIN app_protocol_rules pr ON p.id = pr.protocol_id
          INNER JOIN app_recommended_examination re ON pr.id = re.protocol_rule_id
          WHERE re.team_id = $1
          LIMIT 1
        `;

        const protocolResult = await sequelize.query(protocolQuery, {
          bind: [userTeamId],
          type: sequelize.QueryTypes.SELECT
        });

        protocol = protocolResult && protocolResult.length > 0 ? protocolResult[0] : null;
      }

      // Get recommended examinations (suggested screening)
      // Show the 3 main screening examinations like legacy system
      // Note: Don't filter by deleted for these specific items (RICERCA HPV is deleted=true in DB)
      const suggestedScreeningQuery = `
        SELECT * FROM (
          SELECT DISTINCT ON (ep.label)
            ep.id as examination_id,
            ep.label as examination_label,
            CASE ep.label
              WHEN 'VISITA SENOLOGICA' THEN 1
              WHEN 'RICERCA HPV' THEN 2
              WHEN 'PAP TEST' THEN 3
            END as sort_order
          FROM app_examination_pathology ep
          WHERE ep.examination = true
            AND ep.label IN ('VISITA SENOLOGICA', 'RICERCA HPV', 'PAP TEST')
          ORDER BY ep.label, ep.id
        ) sub
        ORDER BY sort_order
      `;

      const suggestedScreening = await sequelize.query(suggestedScreeningQuery, {
        type: sequelize.QueryTypes.SELECT
      });
      console.log('[Dashboard] suggestedScreening count:', suggestedScreening.length, 'items:', JSON.stringify(suggestedScreening));

      // Get user's pathology IDs for blog filtering
      let userPathologyIds = null;
      if (protocol) {
        const pathologyQuery = `
          SELECT DISTINCT pr.pathology_id
          FROM app_protocol_rules pr
          WHERE pr.protocol_id = $1 AND pr.pathology_id IS NOT NULL
        `;
        const pathologies = await sequelize.query(pathologyQuery, {
          bind: [protocol.id],
          type: sequelize.QueryTypes.SELECT
        });
        userPathologyIds = pathologies.map(p => p.pathology_id);
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
        bind: [protocol ? protocol.id : null, userPathologyIds],
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
          id: s.examination_id,
          examination: {
            id: s.examination_id,
            label: s.examination_label
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
