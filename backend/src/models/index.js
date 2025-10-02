const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const Address = require('./Address');
const Team = require('./Team');
const Typology = require('./Typology');
const Municipality = require('./Municipality');
const UserTeam = require('./UserTeam');
const BlogPost = require('./BlogPost');
const BlogPostAgeRange = require('./BlogPostAgeRange');
const BlogPostCategory = require('./BlogPostCategory');
const BlogPostThematicArea = require('./BlogPostThematicArea');
const BlogPostPathology = require('./BlogPostPathology');
const Protocol = require('./Protocol');
const ThematicArea = require('./ThematicArea');
const ExaminationPathology = require('./ExaminationPathology');

// Define associations
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users'
});

User.belongsToMany(Team, {
  through: UserTeam,
  foreignKey: 'app_user_id',
  otherKey: 'teams_id',
  as: 'teams'
});

Team.belongsToMany(User, {
  through: UserTeam,
  foreignKey: 'teams_id',
  otherKey: 'app_user_id',
  as: 'members'
});

// Direct associations for easier access
User.hasMany(UserRole, {
  foreignKey: 'userId',
  as: 'userRoles'
});

Role.hasMany(UserRole, {
  foreignKey: 'roleId',
  as: 'userRoles'
});

UserRole.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserRole.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role'
});

Team.belongsTo(Address, {
  foreignKey: 'addressId',
  as: 'address'
});

Team.belongsTo(User, {
  foreignKey: 'representativeId',
  as: 'representative'
});

Team.belongsTo(Typology, {
  foreignKey: 'typeId',
  as: 'type'
});

Team.belongsTo(Typology, {
  foreignKey: 'titleId',
  as: 'title'
});

UserTeam.belongsTo(User, {
  foreignKey: 'app_user_id',
  as: 'user'
});

UserTeam.belongsTo(Team, {
  foreignKey: 'teams_id',
  as: 'team'
});

// Blog associations
BlogPost.belongsTo(Team, {
  foreignKey: 'team_id',
  as: 'team'
});

BlogPost.hasMany(BlogPostAgeRange, {
  foreignKey: 'blog_post_id',
  as: 'age_ranges'
});

BlogPost.hasMany(BlogPostCategory, {
  foreignKey: 'blog_post_id',
  as: 'categories'
});

BlogPost.hasMany(BlogPostThematicArea, {
  foreignKey: 'blog_post_id',
  as: 'thematic_areas'
});

BlogPost.hasMany(BlogPostPathology, {
  foreignKey: 'blog_post_id',
  as: 'pathologies'
});

BlogPostAgeRange.belongsTo(BlogPost, {
  foreignKey: 'blog_post_id',
  as: 'blog_post'
});

BlogPostAgeRange.belongsTo(Protocol, {
  foreignKey: 'age_range_id',
  as: 'age_range'
});

BlogPostCategory.belongsTo(BlogPost, {
  foreignKey: 'blog_post_id',
  as: 'blog_post'
});

BlogPostCategory.belongsTo(Typology, {
  foreignKey: 'category_id',
  as: 'category'
});

BlogPostThematicArea.belongsTo(BlogPost, {
  foreignKey: 'blog_post_id',
  as: 'blog_post'
});

BlogPostThematicArea.belongsTo(ThematicArea, {
  foreignKey: 'thematic_area_id',
  as: 'thematic_area'
});

BlogPostPathology.belongsTo(BlogPost, {
  foreignKey: 'blog_post_id',
  as: 'blog_post'
});

BlogPostPathology.belongsTo(ExaminationPathology, {
  foreignKey: 'pathology_id',
  as: 'pathology'
});

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Address,
  Team,
  Typology,
  Municipality,
  UserTeam,
  BlogPost,
  BlogPostAgeRange,
  BlogPostCategory,
  BlogPostThematicArea,
  BlogPostPathology,
  Protocol,
  ThematicArea,
  ExaminationPathology
};
