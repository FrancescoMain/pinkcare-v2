const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  insertion_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  insertion_username: {
    type: DataTypes.STRING
  },
  last_modify_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_modify_username: {
    type: DataTypes.STRING
  },
  title: {
    type: DataTypes.STRING
  },
  headline: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT
  },
  image: {
    type: DataTypes.TEXT // Base64 encoded image
  },
  team_id: {
    type: DataTypes.BIGINT,
    references: {
      model: 'app_team',
      key: 'id'
    }
  },
  all_categories: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  all_thematic_areas: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  all_age_ranges: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  all_pathologies: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  publish_in_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  publish_in_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'app_blog_post',
  timestamps: false,
  hooks: {
    beforeUpdate: (instance) => {
      instance.last_modify_date = new Date();
    }
  }
});

module.exports = BlogPost;
