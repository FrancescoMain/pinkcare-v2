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
const Question = require('./Question');
const ProtocolRule = require('./ProtocolRule');
const Screening = require('./Screening');
const ScreeningResult = require('./ScreeningResult');
const TeamReply = require('./TeamReply');
const CalendarEvent = require('./CalendarEvent');
const EventDetail = require('./EventDetail');
const EventDetailType = require('./EventDetailType');
const TeamSurgery = require('./TeamSurgery');
const Surgery = require('./Surgery');
const GravidanceType = require('./GravidanceType');
const Schedule = require('./Schedule');
const RecommendedExamination = require('./RecommendedExamination');
const TeamExaminationPathology = require('./TeamExaminationPathology');
const AttachedFile = require('./AttachedFile');
const ClinicDocument = require('./ClinicDocument');
const UserClinic = require('./UserClinic');
const Code = require('./Code');

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
  // Team model already has defaultScope filtering deleted='N'
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

// Questionnaire associations
// Question self-reference for sub-questions
Question.hasMany(Question, {
  foreignKey: 'root_id',
  as: 'sub_questions'
});

Question.belongsTo(Question, {
  foreignKey: 'root_id',
  as: 'root'
});

Question.hasMany(ProtocolRule, {
  foreignKey: 'question_id',
  as: 'protocol_rules'
});

ProtocolRule.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question'
});

ProtocolRule.belongsTo(Protocol, {
  foreignKey: 'protocol_id',
  as: 'protocol'
});

ProtocolRule.belongsTo(ThematicArea, {
  foreignKey: 'thematic_area_id',
  as: 'thematic_area'
});

ProtocolRule.belongsTo(ExaminationPathology, {
  foreignKey: 'examination_id',
  as: 'examination'
});

Screening.belongsTo(Team, {
  foreignKey: 'team_id',
  as: 'team'
});

Screening.belongsTo(ThematicArea, {
  foreignKey: 'thematic_area_id',
  as: 'thematic_area'
});

Screening.hasMany(ScreeningResult, {
  foreignKey: 'screening_id',
  as: 'results'
});

ScreeningResult.belongsTo(Screening, {
  foreignKey: 'screening_id',
  as: 'screening'
});

ScreeningResult.belongsTo(RecommendedExamination, {
  foreignKey: 'result_id',
  as: 'result'
});

RecommendedExamination.hasMany(ScreeningResult, {
  foreignKey: 'result_id',
  as: 'screeningResults'
});

TeamReply.belongsTo(Team, {
  foreignKey: 'team_id',
  as: 'team'
});

TeamReply.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question'
});

TeamReply.belongsTo(Screening, {
  foreignKey: 'screening_id',
  as: 'screening'
});

// Calendar Event associations
CalendarEvent.belongsTo(Typology, {
  foreignKey: 'typeId',
  as: 'type'
});

CalendarEvent.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});

CalendarEvent.hasMany(EventDetail, {
  foreignKey: 'eventId',
  as: 'details'
});

EventDetail.belongsTo(CalendarEvent, {
  foreignKey: 'eventId',
  as: 'event'
});

EventDetail.belongsTo(EventDetailType, {
  foreignKey: 'detailTypeId',
  as: 'detailType'
});

EventDetailType.hasMany(EventDetail, {
  foreignKey: 'detailTypeId',
  as: 'details'
});

EventDetailType.belongsTo(Typology, {
  foreignKey: 'eventTypeId',
  as: 'eventType'
});

// Clinical History associations
User.belongsTo(Municipality, {
  foreignKey: 'birthPlaceId',
  as: 'birthPlace'
});

Municipality.hasMany(User, {
  foreignKey: 'birthPlaceId',
  as: 'users'
});

User.hasMany(GravidanceType, {
  foreignKey: 'userId',
  as: 'gravidanceTypes'
});

GravidanceType.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Team.hasMany(TeamSurgery, {
  foreignKey: 'teamId',
  as: 'surgeries'
});

TeamSurgery.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});

TeamSurgery.belongsTo(Surgery, {
  foreignKey: 'surgeryId',
  as: 'surgery'
});

Surgery.hasMany(TeamSurgery, {
  foreignKey: 'surgeryId',
  as: 'teamSurgeries'
});

// No hierarchical structure for surgeries - table doesn't have parent_id column

// Schedule (Agenda) associations
Schedule.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Schedule, {
  foreignKey: 'userId',
  as: 'schedules'
});

// RecommendedExamination associations
RecommendedExamination.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});

RecommendedExamination.belongsTo(ExaminationPathology, {
  foreignKey: 'examinationId',
  as: 'examination'
});

RecommendedExamination.belongsTo(Screening, {
  foreignKey: 'screeningId',
  as: 'screening'
});

RecommendedExamination.belongsTo(ProtocolRule, {
  foreignKey: 'protocolRuleId',
  as: 'protocolRule'
});

Team.hasMany(RecommendedExamination, {
  foreignKey: 'teamId',
  as: 'recommendedExaminations'
});

ExaminationPathology.hasMany(RecommendedExamination, {
  foreignKey: 'examinationId',
  as: 'recommendedExaminations'
});

// TeamExaminationPathology associations (Team <-> ExaminationPathology)
TeamExaminationPathology.belongsTo(Team, {
  foreignKey: 'teamId',
  as: 'team'
});

TeamExaminationPathology.belongsTo(ExaminationPathology, {
  foreignKey: 'examinationPathologyId',
  as: 'examinationPathology'
});

Team.hasMany(TeamExaminationPathology, {
  foreignKey: 'teamId',
  as: 'teamExaminationPathologies'
});

ExaminationPathology.hasMany(TeamExaminationPathology, {
  foreignKey: 'examinationPathologyId',
  as: 'teamExaminationPathologies'
});

// AttachedFile associations
AttachedFile.belongsTo(RecommendedExamination, {
  foreignKey: 'resultId',
  as: 'result'
});

RecommendedExamination.hasMany(AttachedFile, {
  foreignKey: 'resultId',
  as: 'attachedFiles'
});

// UserClinic associations
UserClinic.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserClinic.belongsTo(Team, { foreignKey: 'clinicId', as: 'clinic' });
User.hasMany(UserClinic, { foreignKey: 'userId', as: 'userClinics' });
Team.hasMany(UserClinic, { foreignKey: 'clinicId', as: 'userClinics' });

// ClinicDocument associations
ClinicDocument.belongsTo(UserClinic, { foreignKey: 'appUserClinicId', as: 'userClinic' });
UserClinic.hasMany(ClinicDocument, { foreignKey: 'appUserClinicId', as: 'documents' });

// Code associations
Code.belongsTo(User, { foreignKey: 'businessId', as: 'business' });
UserClinic.belongsTo(Code, { foreignKey: 'idcode', as: 'code' });
Code.hasMany(UserClinic, { foreignKey: 'idcode', as: 'userClinics' });

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
  ExaminationPathology,
  Question,
  ProtocolRule,
  Screening,
  ScreeningResult,
  TeamReply,
  CalendarEvent,
  EventDetail,
  EventDetailType,
  TeamSurgery,
  Surgery,
  GravidanceType,
  Schedule,
  RecommendedExamination,
  TeamExaminationPathology,
  AttachedFile,
  ClinicDocument,
  UserClinic,
  Code
};
