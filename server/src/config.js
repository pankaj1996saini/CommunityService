require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/community_service',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpires: process.env.JWT_EXPIRES_IN || '7d',
};

if (!process.env.JWT_SECRET) {
  console.warn('[config] JWT_SECRET not set, using the dev default. Fine locally, not for a real deployment.');
}

module.exports = config;
