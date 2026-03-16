require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
  }
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-jwt-secret-do-not-use-in-prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret-do-not-use-in-prod',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker',
  isProduction,
};
