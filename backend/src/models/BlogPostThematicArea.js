const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPostThematicArea = sequelize.define('BlogPostThematicArea', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: false,
    allowNull: false
  },
  blog_post_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_blog_post',
      key: 'id'
    }
  },
  thematic_area_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_thematic_area',
      key: 'id'
    }
  }
}, {
  tableName: 'app_blog_post_thematic_area',
  timestamps: false
});

module.exports = BlogPostThematicArea;
