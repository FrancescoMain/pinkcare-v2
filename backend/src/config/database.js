const { Sequelize } = require('sequelize');

// Database connection configuration (from data-access-config.xml)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'PINKCARE_DB',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'pinkcare2025',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
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
  }
);

module.exports = { sequelize };