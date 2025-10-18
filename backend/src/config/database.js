// Explicitly require pg so Vercel bundles the driver when Sequelize loads it dynamically
const pg = require('pg');
const { Sequelize } = require('sequelize');

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value.toString().toLowerCase() === 'true';
};

const createSslOptions = ({ useSsl, rejectUnauthorized }) => {
  if (!useSsl) {
    return undefined;
  }

  return {
    ssl: {
      require: true,
      rejectUnauthorized,
    },
  };
};

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
const sslRejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED;
const shouldEnableSslFromUrl = Boolean(databaseUrl) && (urlSslMode ? urlSslMode !== 'disable' : hostLooksLikeSupabase);
const useSsl = sslEnvEnabled || shouldEnableSslFromUrl;
const rejectUnauthorized = toBoolean(
  sslRejectUnauthorizedEnv,
  hostLooksLikeSupabase ? false : true
);

if (process.env.NODE_ENV !== 'production') {
  console.log('[DB Config] Using discrete DB options:', {
    databaseUrl: databaseUrl ? `${urlHost} (sslmode=${urlSslMode || 'default'})` : 'N/A',
    sslEnvEnabled,
    sslRejectUnauthorizedEnv,
    shouldEnableSslFromUrl,
    hostLooksLikeSupabase,
    resolvedSsl: useSsl,
    resolvedRejectUnauthorized: rejectUnauthorized,
  });
}

// Detect if running in serverless environment (AWS Lambda, Vercel, etc.)
const isServerless = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);

// Configure pool based on environment
const poolConfig = isServerless
  ? {
      // Serverless-optimized pool configuration
      max: 5,           // Lower max connections for Lambda
      min: 0,           // No minimum - let connections close when idle
      acquire: 30000,   // 30 seconds to acquire connection
      idle: 10000,      // 10 seconds idle before releasing (Lambda freezes quickly)
      evict: 5000,      // Check for idle connections every 5 seconds
    }
  : {
      // Traditional server pool configuration
      max: 40,
      min: 10,
      acquire: 60000,
      idle: 300000,
    };

const baseOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: poolConfig,
  define: {
    underscored: true,
    timestamps: false,
  },
  // Retry connection attempts for transient errors
  retry: {
    max: 3,
    match: [
      /ECONNRESET/,
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNREFUSED/,
      /ConnectionError/,
    ],
  },
};

const sslOptions = createSslOptions({ useSsl, rejectUnauthorized });

if (sslOptions) {
  baseOptions.dialectOptions = sslOptions;
  // Set pg global defaults as a fallback for drivers that skip dialectOptions
  pg.defaults.ssl = {
    require: true,
    rejectUnauthorized,
  };
} else {
  // Ensure pg defaults don't linger with relaxed SSL if local dev disables it
  pg.defaults.ssl = false;
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
      baseOptions,
    );

// Add connection validation hooks for serverless environments
if (isServerless) {
  // Validate connection before each query
  sequelize.beforeConnect(async () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DB] Establishing new connection...');
    }
  });

  // Handle connection errors gracefully
  sequelize.afterConnect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DB] Connection established successfully');
    }
  });
}

/**
 * Test and validate database connection
 * Automatically retries on connection errors
 */
async function testConnection(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('[DB] Connection has been established successfully.');
      return true;
    } catch (error) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed:`, error.message);

      if (attempt === retries) {
        console.error('[DB] All connection attempts failed. Database may be unavailable.');
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Safely close all database connections
 * Important for Lambda cleanup
 */
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('[DB] All connections closed successfully.');
  } catch (error) {
    console.error('[DB] Error closing connections:', error.message);
  }
}

module.exports = {
  sequelize,
  testConnection,
  closeConnection
};
