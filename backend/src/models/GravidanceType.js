const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// GravidanceType model - represents pregnancy types and outcomes
const GravidanceType = sequelize.define('GravidanceType', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  // Foreign key
  userId: {
    type: DataTypes.BIGINT,
    field: 'user_id',
    allowNull: false,
    comment: 'Reference to app_user'
  },

  // Sequence number
  seqGravidance: {
    type: DataTypes.INTEGER,
    field: 'seq_gravidance',
    allowNull: false,
    comment: 'Sequence number for this pregnancy'
  },

  // Pregnancy information
  natur: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Type of pregnancy outcome: nat (natural), cae (cesarean), abo (abortion)'
  }
}, {
  tableName: 'app_user_type_gravidance',
  timestamps: false,
  indexes: [
    {
      name: 'idx_gravidance_type_user',
      fields: ['user_id']
    }
  ]
});

module.exports = GravidanceType;
