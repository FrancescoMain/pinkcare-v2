const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentShop = sequelize.define('DocumentShop', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  doctorId: {
    type: DataTypes.BIGINT,
    field: 'doctor_id'
  },
  clinicId: {
    type: DataTypes.BIGINT,
    field: 'clinic_id'
  },
  dataLoad: {
    type: DataTypes.DATE,
    field: 'dataload'
  },
  doc: {
    type: DataTypes.TEXT
  },
  nameFile: {
    type: DataTypes.STRING(50),
    field: 'name_file'
  },
  namePatient: {
    type: DataTypes.STRING(50),
    field: 'name_patient'
  },
  surnamePatient: {
    type: DataTypes.STRING(50),
    field: 'surname_patient'
  },
  notes: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'app_documents_shop',
  timestamps: false
});

module.exports = DocumentShop;
