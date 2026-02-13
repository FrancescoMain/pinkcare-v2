const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * AttachedFile Model
 * Maps to legacy app_attached_file table
 * Stores files attached to recommended examinations
 */
const AttachedFile = sequelize.define('AttachedFile', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  insertionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'insertion_date'
  },
  insertionUsername: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'insertion_username'
  },
  lastModifyDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_modify_date'
  },
  lastModifyUsername: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'last_modify_username'
  },
  pathFile: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'path_file'
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'filename'
  },
  publicName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'public_name'
  },
  publicPath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'public_path'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'title'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'description'
  },
  weight: {
    type: DataTypes.DECIMAL(19, 2),
    allowNull: true,
    field: 'weight'
  },
  googleDriveId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'google_drive_id'
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'deleted'
  },
  resultId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'result_id',
    references: {
      model: 'app_recommended_examination',
      key: 'id'
    }
  },
  inviaNotifica: {
    type: DataTypes.CHAR(1),
    allowNull: true,
    defaultValue: 'Y',
    field: 'invia_notifica'
  }
}, {
  tableName: 'app_attached_file',
  timestamps: false,
  defaultScope: {
    where: {
      deleted: false
    }
  },
  scopes: {
    withDeleted: {}
  }
});

module.exports = AttachedFile;
