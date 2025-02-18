import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import express from 'express';
import { TopicController } from './controllers/TopicController';
import { AuthController } from './controllers/AuthController';
import { DatabaseService } from './services/DatabaseService';
import { TopicService } from './services/TopicService';
import { AuthService } from './services/AuthService';
import { LoggingService } from './services/LoggingService';
import { authMiddleware, roleGuard } from './middleware/auth.middleware';
import { UserRole } from './types';

const app = express();
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Services
const db = new DatabaseService();
const logger = new LoggingService();
const topicService = new TopicService(db);
const authService = new AuthService(db, logger);

// Initialize default admin user
authService.addDefaultUser().catch((error) => {
  logger.error('Failed to create default admin user:', error);
});

// Controllers
const topicController = new TopicController(topicService, logger);
const authController = new AuthController(authService, logger);

// Auth routes
app.post('/auth/register', authController.register.bind(authController));
app.post('/auth/login', authController.login.bind(authController));
app.get('/auth/user-info', authController.userInfo.bind(authController));

// Protected routes
app.use('/topics', authMiddleware);

// Topic routes with role-based access
app.get(
  '/topics/list',
  roleGuard([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopicsList.bind(topicController),
);

app.post(
  '/topics',
  roleGuard([UserRole.ADMIN, UserRole.EDITOR]),
  topicController.createTopic.bind(topicController),
);

app.put(
  '/topics/:id',
  roleGuard([UserRole.ADMIN, UserRole.EDITOR]),
  topicController.updateTopic.bind(topicController),
);

app.get(
  '/topics/:id',
  roleGuard([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopic.bind(topicController),
);

app.get(
  '/topics/:id/hierarchy',
  roleGuard([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopicHierarchy.bind(topicController),
);

app.get(
  '/topics/:startId/path/:endId',
  roleGuard([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.findPath.bind(topicController),
);

const PORT = process.env.PORT || 3016;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
