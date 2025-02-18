import dotenv from 'dotenv';
import { createApp } from './app';

// Load environment variables
dotenv.config();

import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';
import { LoggingService } from './services/LoggingService';

const db = new DatabaseService();
const logger = new LoggingService();
const authService = new AuthService(db, logger);

const app = createApp(db, authService, logger);

// Initialize default admin user
authService.addDefaultUser().catch((error) => {
  logger.error('Failed to create default admin user:', error);
});

const PORT = process.env.PORT || 3016;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
