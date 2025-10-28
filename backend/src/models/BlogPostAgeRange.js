const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPostAgeRange = sequelize.define('BlogPostAgeRange', {
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
  age_range_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_protocol',
      key: 'id'
    }
  }
}, {
  tableName: 'app_blog_post_age_range',
  timestamps: false
});

module.exports = BlogPostAgeRange;
