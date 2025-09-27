const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Municipality = sequelize.define('Municipality', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  istatCode: {
    type: DataTypes.STRING,
    field: 'istat_code'
  },
  landRegistryCode: {
    type: DataTypes.STRING,
    field: 'land_registry_code'
  },
  link: {
    type: DataTypes.STRING,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nationalCode: {
    type: DataTypes.STRING,
    field: 'national_code'
  },
  postCode: {
    type: DataTypes.STRING,
    field: 'post_code'
  },
  prefix: {
    type: DataTypes.STRING,
  },
  provincialCode: {
    type: DataTypes.STRING,
    field: 'provincial_code'
  },
  region: {
    type: DataTypes.STRING,
  },
  residents: {
    type: DataTypes.INTEGER,
  },
  lng: {
    type: DataTypes.STRING,
  },
  lat: {
    type: DataTypes.STRING,
  }
}, {
  tableName: 'app_municipality',
  timestamps: false
});

module.exports = Municipality;
