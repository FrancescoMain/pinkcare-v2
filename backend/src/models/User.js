const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// User model based on it.tione.pinkcare.model.User.java
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  
  // Audit fields
  insertionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'insertion_date'
  },
  insertionUsername: {
    type: DataTypes.STRING,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'last_modify_date'
  },
  lastModifyUsername: {
    type: DataTypes.STRING,
    field: 'last_modify_username'
  },
  firstLoginDate: {
    type: DataTypes.DATE,
    field: 'first_login_date'
  },
  
  // Profile completion flag
  filledPersonalForm: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'filled_personal_form'
  },
  
  // Authentication fields
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passwordRecovery: {
    type: DataTypes.STRING,
    field: 'password_recovery'
  },
  
  // Personal information
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nameToValidate: {
    type: DataTypes.STRING,
    field: 'name_to_validate'
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: true
  },
  surnameToValidate: {
    type: DataTypes.STRING,
    field: 'surname_to_validate'
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  nickName: {
    type: DataTypes.STRING,
    field: 'nick_name'
  },
  
  // Demographics
  birthday: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // false = female, true = male (from Java model)
  },
  
  // Privacy agreements
  agreeConditionAndPrivacy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'agree_condition_and_privacy'
  },
  agreeToBeShown: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'agree_to_be_shown'
  },
  agreeMarketing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'agree_marketing'
  },
  agreeNewsletter: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'agree_newsletter'
  },
  
  // Contact
  mobilePhone: {
    type: DataTypes.STRING,
    field: 'mobile_phone'
  },
  
  // Health information
  weight: {
    type: DataTypes.FLOAT
  },
  height: {
    type: DataTypes.FLOAT
  },
  sedentaryLifestyle: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'sedentary_lifestyle'
  },
  ageFirstMenstruation: {
    type: DataTypes.INTEGER,
    field: 'age_first_menstruation'
  },
  regularityMenstruation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'regularity_menstruation'
  },
  durationMenstruation: {
    type: DataTypes.INTEGER,
    field: 'duration_menstruation'
  },
  durationPeriod: {
    type: DataTypes.INTEGER,
    field: 'duration_period'
  },

  // Pregnancy tracking
  ovulationDate: {
    type: DataTypes.DATE,
    field: 'ovulation_date',
    comment: 'Calculated or tracked ovulation date'
  },
  childbirthdate: {
    type: DataTypes.DATE,
    field: 'childbirthdate',
    comment: 'Expected delivery date for pregnancy'
  },

  // Medical history
  surgery: {
    type: DataTypes.TEXT
  },
  medicine: {
    type: DataTypes.TEXT
  },

  // Birth place (foreign key to Municipality)
  birthPlaceId: {
    type: DataTypes.BIGINT,
    field: 'birth_place_id'
  }
}, {
  tableName: 'app_user',
  indexes: [
    {
      name: 'index_user',
      fields: ['name', 'surname', 'insertion_date']
    }
  ]
});

module.exports = User;