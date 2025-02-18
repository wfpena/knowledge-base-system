export const config = {
  port: process.env.PORT || 3016,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-production',
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DB_PATH || './data/database.sqlite',
  isDevelopment: process.env.NODE_ENV === 'development',
};
