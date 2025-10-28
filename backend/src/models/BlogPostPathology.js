const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPostPathology = sequelize.define('BlogPostPathology', {
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
  pathology_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_examination_pathology',
      key: 'id'
    }
  }
}, {
  tableName: 'app_blog_post_pathology',
  timestamps: false
});

module.exports = BlogPostPathology;
