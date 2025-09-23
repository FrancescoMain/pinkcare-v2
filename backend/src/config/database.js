// Explicitly require pg so Vercel bundles the driver when Sequelize loads it dynamically
require('pg');
const { Sequelize } = require('sequelize');

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value.toString().toLowerCase() === 'true';
};

// Database connection configuration (from data-access-config.xml)
const databaseUrl = process.env.DATABASE_URL;
let urlHost = '';
let urlSslMode = '';

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    urlHost = parsed.hostname || '';
    urlSslMode = (parsed.searchParams.get('sslmode') || '').toLowerCase();
  } catch (error) {
    console.warn('Invalid DATABASE_URL provided, falling back to discrete credentials:', error.message);
  }
}

const hostLooksLikeSupabase =
  urlHost.endsWith('.supabase.co') ||
  urlHost.endsWith('.pooler.supabase.com') ||
  urlHost.includes('.supabase.');

const sslEnvEnabled = toBoolean(process.env.DB_SSL);
const shouldEnableSslFromUrl = Boolean(databaseUrl) && (urlSslMode ? urlSslMode !== 'disable' : hostLooksLikeSupabase);

const useSsl = sslEnvEnabled || shouldEnableSslFromUrl;
const rejectUnauthorized = toBoolean(
  process.env.DB_SSL_REJECT_UNAUTHORIZED,
  hostLooksLikeSupabase ? false : true
);

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

if (useSsl) {
  baseOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized
    }
  };
}

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
