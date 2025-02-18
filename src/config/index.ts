export const config = {
  port: process.env.PORT || 3016,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-production',
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '27017', 10),
    name: process.env.DB_NAME || 'knowledge_base',
  },
  isDevelopment: process.env.NODE_ENV === 'development',
};
