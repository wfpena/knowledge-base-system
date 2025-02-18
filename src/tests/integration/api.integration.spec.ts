import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../app'; // We'll create this
import { DatabaseService } from '../../services/DatabaseService';
import { AuthService } from '../../services/AuthService';
import { LoggingService } from '../../services/LoggingService';

describe('API Integration Tests', () => {
  let app: Express;
  let dbService: DatabaseService;
  let authToken: string;

  beforeAll(async () => {
    dbService = new DatabaseService();
    const logger = new LoggingService();
    const authService = new AuthService(dbService, logger);
    app = createApp(dbService, authService, logger);

    // Create and login as admin
    await authService.addDefaultUser();
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });

    authToken = loginResponse.body.token;
  });

  beforeEach(() => {
    dbService.clearDatabase();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should login and return JWT token', async () => {
      // First register a user
      await request(app).post('/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      // Then try to login
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Topics API', () => {
    it('should create a new topic', async () => {
      const response = await request(app)
        .post('/topics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Topic',
          content: 'Test Content',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Topic');
    });

    it('should get topic list', async () => {
      // Create a topic first
      await request(app).post('/topics').set('Authorization', `Bearer ${authToken}`).send({
        name: 'Test Topic',
        content: 'Test Content',
      });

      const response = await request(app)
        .get('/topics/list')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('should update a topic', async () => {
      // Create a topic first
      const createResponse = await request(app)
        .post('/topics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Topic',
          content: 'Original Content',
        });

      const updateResponse = await request(app)
        .put(`/topics/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Topic',
          content: 'Updated Content',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated Topic');
      expect(updateResponse.body.version).toBe(2);
    });

    it('should get topic hierarchy', async () => {
      // Create parent topic
      const parentResponse = await request(app)
        .post('/topics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Parent Topic',
          content: 'Parent Content',
        });

      // Create child topic
      await request(app).post('/topics').set('Authorization', `Bearer ${authToken}`).send({
        name: 'Child Topic',
        content: 'Child Content',
        parentTopicId: parentResponse.body.id,
      });

      const hierarchyResponse = await request(app)
        .get(`/topics/${parentResponse.body.id}/hierarchy`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(hierarchyResponse.status).toBe(200);
      expect(hierarchyResponse.body.children).toHaveLength(1);
      expect(hierarchyResponse.body.children[0].name).toBe('Child Topic');
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      const response = await request(app).get('/topics/list');
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/topics/list')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
    });
  });
});
