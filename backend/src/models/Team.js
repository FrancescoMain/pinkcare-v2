const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Team model based on it.tione.pinkcare.model.Team.java
const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  active: {
    type: DataTypes.CHAR,
    defaultValue: 'Y'
  },
  deleted: {
    type: DataTypes.CHAR,
    defaultValue: 'N'
  },
  insertionDate: {
    type: DataTypes.DATE,
    field: 'insertion_date',
    defaultValue: DataTypes.NOW
  },
  insertionUsername: {
    type: DataTypes.STRING,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    field: 'last_modify_date',
    defaultValue: DataTypes.NOW
  },
  lastModifyUsername: {
    type: DataTypes.STRING,
    field: 'last_modify_username'
  },
  licensePurchase: {
    type: DataTypes.DATE,
    field: 'license_purchase'
  },
  licenseRenew: {
    type: DataTypes.DATE,
    field: 'license_renew'
  },
  licenseExpiration: {
    type: DataTypes.DATE,
    field: 'license_expiration'
  },
  name: {
    type: DataTypes.STRING,
  },
  nameToValidate: {
    type: DataTypes.STRING,
    field: 'name_to_validate'
  },
  registrationCode: {
    type: DataTypes.STRING,
    field: 'registration_code'
  },
  secondEmail: {
    type: DataTypes.STRING,
    field: 'second_email'
  },
  taxCode: {
    type: DataTypes.STRING,
    field: 'tax_code'
  },
  vatNumber: {
    type: DataTypes.STRING,
    field: 'vat_number'
  },
  landlinePhone: {
    type: DataTypes.STRING,
    field: 'landline_phone'
  },
  mobilePhone: {
    type: DataTypes.STRING,
    field: 'mobile_phone'
  },
  fax: {
    type: DataTypes.STRING,
  },
  website: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  emailToValidate: {
    type: DataTypes.STRING,
    field: 'email_to_validate'
  },
  medicalTitle: {
    type: DataTypes.STRING,
    field: 'medical_title'
  },
  medicalTitleToValidate: {
    type: DataTypes.STRING,
    field: 'medical_title_to_validate'
  },
  description: {
    type: DataTypes.TEXT,
  },
  descriptionToValidate: {
    type: DataTypes.TEXT,
    field: 'description_to_validate'
  },
  medicalPublications: {
    type: DataTypes.TEXT,
    field: 'medical_publications'
  },
  medicalPublicationsToValidate: {
    type: DataTypes.TEXT,
    field: 'medical_publications_to_validate'
  },
  searchable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  instrumentation: {
    type: DataTypes.TEXT,
  },
  instrumentationToValidate: {
    type: DataTypes.TEXT,
    field: 'instrumentation_to_validate'
  },
  structureDimension: {
    type: DataTypes.DOUBLE,
    field: 'structure_dimension'
  },
  structureDimensionToValidate: {
    type: DataTypes.DOUBLE,
    field: 'structure_dimension_to_validate'
  },
  linkshop: {
    type: DataTypes.STRING,
  },
  linkshopToValidate: {
    type: DataTypes.STRING,
    field: 'linkshop_to_validate'
  },
  addressId: {
    type: DataTypes.BIGINT,
    field: 'address_id'
  },
  representativeId: {
    type: DataTypes.BIGINT,
    field: 'representative_id'
  },
  titleId: {
    type: DataTypes.BIGINT,
    field: 'title_id'
  },
  typeId: {
    type: DataTypes.BIGINT,
    field: 'type_id'
  }
}, {
  tableName: 'app_team',
  timestamps: false
});

module.exports = Team;
