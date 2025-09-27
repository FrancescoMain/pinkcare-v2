const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const Address = require('./Address');
const Team = require('./Team');
const Typology = require('./Typology');
const Municipality = require('./Municipality');
const UserTeam = require('./UserTeam');

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

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Address,
  Team,
  Typology,
  Municipality,
  UserTeam
};
