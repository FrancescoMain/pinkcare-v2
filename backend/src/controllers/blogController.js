const blogService = require('../services/blogService');
const userService = require('../services/userService');

class BlogController {
  /**
   * GET /api/blog
   * Get all blog posts with filters
   */
  async getPosts(req, res) {
    try {
      const { text, ageRangeId, categoryId, thematicAreaId, pathologyId, page = 0, limit = 20 } = req.query;
      const user = req.user;

      // Get user's role (req.user.roles is already an array of role names)
      const roles = user.roles || [];
      const primaryRole = roles.includes('ROLE_PINKCARE') ? 'ROLE_PINKCARE' :
                         roles.includes('ROLE_BUSINESS') ? 'ROLE_BUSINESS' :
                         'ROLE_CONSUMER';

      // Get user's team
      const userTeamId = user.teams?.[0]?.id || null;

      console.log('[BlogController] getPosts - userId:', user.id, 'primaryRole:', primaryRole, 'userTeamId:', userTeamId, 'teams:', JSON.stringify(user.teams));

      // Get user's age range and pathologies if consumer
      let userAgeRange = null;
      let userPathologies = null;

      if (primaryRole === 'ROLE_CONSUMER') {
        // TODO: Implement getByUser to get age range from user data
        // userAgeRange = await protocolService.getByUser(user);

        // TODO: Implement getUserPathologyIds
        // userPathologies = await recommendedExaminationService.getUserPathologyIds(userTeamId);
      }

      const result = await blogService.findPosts(
        { text, ageRangeId, categoryId, thematicAreaId, pathologyId },
        primaryRole,
        userTeamId,
        userAgeRange,
        userPathologies,
        parseInt(page),
        parseInt(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error getting blog posts:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/blog/:id
   * Get single blog post
   */
  async getPost(req, res) {
    try {
      const post = await blogService.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Error getting blog post:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/blog
   * Create new blog post
   */
  async createPost(req, res) {
    try {
      const user = req.user;
      const roles = user.roles || [];
      const primaryRole = roles.includes('ROLE_PINKCARE') ? 'ROLE_PINKCARE' :
                         roles.includes('ROLE_BUSINESS') ? 'ROLE_BUSINESS' :
                         null;

      if (!primaryRole) {
        return res.status(403).json({ error: 'Only PINKCARE and BUSINESS users can create posts' });
      }

      const userTeamId = user.teams?.[0]?.id;
      if (!userTeamId) {
        return res.status(400).json({ error: 'User must belong to a team' });
      }

      const post = await blogService.createPost(
        req.body,
        user.id,
        userTeamId,
        primaryRole
      );

      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/blog/:id
   * Update blog post
   */
  async updatePost(req, res) {
    try {
      const user = req.user;
      const username = `${user.name} ${user.surname}`;

      const post = await blogService.updatePost(
        req.params.id,
        req.body,
        username
      );

      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/blog/:id
   * Delete blog post
   */
  async deletePost(req, res) {
    try {
      await blogService.deletePost(req.params.id);
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/blog/filters/options
   * Get filter options (age ranges, categories, etc.)
   */
  async getFilterOptions(req, res) {
    try {
      const options = await blogService.getFilterOptions();
      res.json(options);
    } catch (error) {
      console.error('Error getting filter options:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BlogController();
