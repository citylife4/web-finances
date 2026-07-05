require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Refuse to boot in production with default/missing secrets
if (isProduction && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in production.');
  process.exit(1);
}

// Support both CORS_ORIGINS and the legacy ALLOWED_ORIGINS variable
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS;

module.exports = {
  isProduction,
  port: process.env.PORT || 3001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret',
  corsOrigins: corsOriginsEnv
    ? corsOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000']
};
