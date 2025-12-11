const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Allow self-signed certificate from Supabase session pooler when running on Vercel
if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const envFile = process.env.ENV_FILE
  ? path.resolve(__dirname, process.env.ENV_FILE)
  : path.resolve(__dirname, '.env');

const envResult = require('dotenv').config({ path: envFile });

if (process.env.ENV_FILE && envResult.error) {
  console.warn(`⚠️  Impossibile caricare il file di ambiente ${envFile}:`, envResult.error.message);
}

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const referenceRoutes = require('./src/routes/reference');
const dashboardRoutes = require('./src/routes/dashboard');
const blogRoutes = require('./src/routes/blog');
const questionnaireRoutes = require('./src/routes/questionnaire');
const calendarRoutes = require('./src/routes/calendar');
const clinicalHistoryRoutes = require('./src/routes/clinicalHistory');
const scheduleRoutes = require('./src/routes/schedule');
const { testConnection } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/clinical-history', clinicalHistoryRoutes);
app.use('/api/schedule', scheduleRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors || err.message
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Email già registrata'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Errore interno del server'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection with retry logic
    await testConnection();

    // Skip model sync to use existing database structure
    console.log('✓ Using existing database structure.');

    // Start server
    app.listen(PORT, () => {
      const dbLabel = (() => {
        if (process.env.DATABASE_URL) {
          try {
            const parsed = new URL(process.env.DATABASE_URL);
            return `${parsed.pathname.replace('/', '')}@${parsed.hostname}:${parsed.port || '5432'}`;
          } catch (err) {
            return process.env.DATABASE_URL;
          }
        }
        return `${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`;
      })();

      console.log(`🚀 PinkCare API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️  Database: ${dbLabel}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
