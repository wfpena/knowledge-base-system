import express from 'express';
import path from 'path';
import { TopicController } from './controllers/TopicController';
import { AuthController } from './controllers/AuthController';
import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';
import { LoggingService } from './services/LoggingService';
import { TopicService } from './services/TopicService';
import { authMiddleware, roleGuard } from './middleware/auth.middleware';
import { UserRole } from './types';

export function createApp(
  dbService: DatabaseService,
  authService: AuthService,
  logger: LoggingService,
) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  const topicService = new TopicService(dbService);
  const topicController = new TopicController(topicService, logger);
  const authController = new AuthController(authService, logger);

  // Auth routes
  app.post('/auth/register', authController.register.bind(authController));
  app.post('/auth/login', authController.login.bind(authController));

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

  return app;
} 