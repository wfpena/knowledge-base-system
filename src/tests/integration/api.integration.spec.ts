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
  let viewerToken: string;

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

    // Create and login as viewer
    await authService.addDefaultUser();
    await request(app)
      .post('/auth/register')
      .send({ email: 'viewer@viewer.com', password: 'viewer', name: 'Viewer User' });

    const viewerLoginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'viewer@viewer.com', password: 'viewer' });

    viewerToken = viewerLoginResponse.body.token;
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

    it('should register users as VIEWER by default', async () => {
      const response = await request(app).post('/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('role');
      expect(response.body.role).toBe('VIEWER');
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

    it('should not allow VIEWER to create a topic', async () => {
      const response = await request(app)
        .post('/topics')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Test Topic',
          content: 'Test Content',
        });

      expect(response.status).toBe(403);
    });

    describe('Shortest Path', () => {
      let topic1: any;
      let topic2: any;
      let topic3: any;

      it('should find shortest path between topics', async () => {
        // Create a chain of topics
        topic1 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 1',
            content: 'Content 1',
          });

        topic2 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 2',
            content: 'Content 2',
            parentTopicId: topic1.body.id,
          });

        topic3 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 3',
            content: 'Content 3',
            parentTopicId: topic2.body.id,
          });

        const response = await request(app)
          .get(`/topics/${topic1.body.id}/path/${topic3.body.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([topic1.body.id, topic2.body.id, topic3.body.id]);
      });

      it('should return null if no path is found', async () => {
        topic1 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 1',
            content: 'Content 1',
          });

        topic2 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 2',
            content: 'Content 2',
          });

        topic3 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 3',
            content: 'Content 3',
            parentTopicId: topic2.body.id,
          });

        const response = await request(app)
          .get(`/topics/${topic1.body.id}/path/${topic3.body.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });

      it('should be able to find shortest path when a topic is updated', async () => {
        topic1 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 1',
            content: 'Content 1',
          });

        topic2 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 2',
            content: 'Content 2',
            parentTopicId: topic1.body.id,
          });

        topic3 = await request(app)
          .post('/topics')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Topic 3',
            content: 'Content 3',
            parentTopicId: topic2.body.id,
          });

        const updateResponse = await request(app)
          .put(`/topics/${topic1.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated Topic',
            content: 'Updated Content',
          });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.id).toBe(topic1.body.id);
        expect(updateResponse.body.createdAt).toBe(topic1.body.createdAt);
        expect(updateResponse.body.updatedAt).not.toBe(topic1.body.updatedAt);
        expect(updateResponse.body.name).toBe('Updated Topic');
        expect(updateResponse.body.version).toBe(2);

        const response = await request(app)
          .get(`/topics/${updateResponse.body.id}/path/${topic3.body.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([topic1.body.id, topic2.body.id, topic3.body.id]);
      });
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
