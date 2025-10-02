const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPostCategory = sequelize.define('BlogPostCategory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  blog_post_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_blog_post',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_typology',
      key: 'id'
    }
  }
}, {
  tableName: 'app_blog_post_category',
  timestamps: false
});

module.exports = BlogPostCategory;
