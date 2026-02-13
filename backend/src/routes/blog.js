const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const AuthMiddleware = require('../middleware/auth');

// Get filter options (public)
router.get('/filters/options', blogController.getFilterOptions);

// Public blog posts (no auth required) - matches legacy public blog behavior
router.get('/public', blogController.getPublicPosts);

// Public single post (no auth required)
router.get('/public/:id', blogController.getPublicPost);

// Get all posts (requires authentication)
router.get('/', AuthMiddleware.verifyToken, blogController.getPosts);

// Get single post
router.get('/:id', AuthMiddleware.verifyToken, blogController.getPost);

// Create post (PINKCARE or BUSINESS only)
router.post('/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ROLE_PINKCARE', 'ROLE_BUSINESS']),
  blogController.createPost
);

// Update post (PINKCARE or BUSINESS only)
router.put('/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ROLE_PINKCARE', 'ROLE_BUSINESS']),
  blogController.updatePost
);

// Delete post (PINKCARE or BUSINESS only)
router.delete('/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole(['ROLE_PINKCARE', 'ROLE_BUSINESS']),
  blogController.deletePost
);

module.exports = router;
