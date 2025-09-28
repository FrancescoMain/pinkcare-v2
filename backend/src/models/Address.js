const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Address model based on it.tione.pinkcare.model.Address.java
const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nation: {
    type: DataTypes.STRING,
    defaultValue: 'IT'
  },
  region: {
    type: DataTypes.STRING,
  },
  province: {
    type: DataTypes.STRING,
  },
  postCode: {
    type: DataTypes.STRING,
    field: 'post_code'
  },
  municipality: {
    type: DataTypes.STRING,
  },
  istatCode: {
    type: DataTypes.STRING,
    field: 'istat_code'
  },
  street: {
    type: DataTypes.STRING,
  },
  streetType: {
    type: DataTypes.STRING,
    field: 'street_type'
  },
  streetNumber: {
    type: DataTypes.STRING,
    field: 'street_number'
  },
  detail: {
    type: DataTypes.STRING,
  },
  latitude: {
    type: DataTypes.STRING,
  },
  longitude: {
    type: DataTypes.STRING,
  },
  pertinence: {
    type: DataTypes.STRING,
  },
  note: {
    type: DataTypes.STRING,
  },
  zone: {
    type: DataTypes.STRING,
  },
  at: {
    type: DataTypes.STRING,
  },
  typologyString: {
    type: DataTypes.STRING,
    field: 'typology_string'
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'app_address',
  timestamps: false,
});

module.exports = Address;
