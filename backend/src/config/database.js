const { Sequelize } = require('sequelize');

// Database connection configuration (from data-access-config.xml)
const sslEnabled = (process.env.DB_SSL || '').toLowerCase() === 'true';

const dialectOptions = {};

if (sslEnabled) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: (process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'true'
  };
}

const baseOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 40,          // maxPoolSize from Spring config
    min: 10,          // minPoolSize from Spring config
    acquire: 60000,   // maximum time to get connection
    idle: 300000      // maxIdleTimeExcessConnections from Spring config
  },
  define: {
    // Use snake_case for database columns but camelCase in JavaScript
    underscored: true,
    // Don't add timestamps by default (we'll add them manually where needed)
    timestamps: false
  }
};

if (Object.keys(dialectOptions).length > 0) {
  baseOptions.dialectOptions = dialectOptions;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  baseOptions.host = process.env.DB_HOST || 'localhost';
  baseOptions.port = process.env.DB_PORT || 5432;
}

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, baseOptions)
  : new Sequelize(
      process.env.DB_NAME || 'PINKCARE_DB',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'pinkcare2025',
      baseOptions
    );

module.exports = { sequelize };
