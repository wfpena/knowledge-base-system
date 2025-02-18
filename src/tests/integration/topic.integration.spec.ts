import { TopicService } from '../../services/TopicService';
import { DatabaseService } from '../../services/DatabaseService';

describe('Topic Integration Tests', () => {
  let topicService: TopicService;
  let dbService: DatabaseService;

  beforeEach(() => {
    dbService = new DatabaseService();
    topicService = new TopicService(dbService);
  });

  afterEach(async () => {
    // Clear database after each test
    (dbService as any).topics.clear();
  });

  describe('Topic CRUD Operations', () => {
    it('should create and retrieve a topic', async () => {
      // Create a topic
      const createdTopic = await topicService.createTopic(
        'Integration Test Topic',
        'Test Content',
        null,
      );

      // Retrieve the topic
      const retrievedTopic = await topicService.getLatestTopic(createdTopic.id);

      expect(retrievedTopic).toBeDefined();
      expect(retrievedTopic?.name).toBe('Integration Test Topic');
      expect(retrievedTopic?.content).toBe('Test Content');
      expect(retrievedTopic?.version).toBe(1);
    });

    it('should handle topic versioning correctly', async () => {
      // Create initial version
      const topic = await topicService.createTopic('Version Test', 'Initial Content', null);

      // Update the topic
      const updatedTopic = await topicService.updateTopic(
        topic.id,
        'Version Test Updated',
        'Updated Content',
      );

      // Get all versions from database
      const versions = (dbService as any).topics.get(topic.id);

      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
      expect(updatedTopic.content).toBe('Updated Content');
    });
  });

  describe('Topic Hierarchy', () => {
    it('should maintain correct parent-child relationships', async () => {
      // Create parent topic
      const parentTopic = await topicService.createTopic('Parent Topic', 'Parent Content', null);

      // Create child topics
      const child1 = await topicService.createTopic('Child 1', 'Child 1 Content', parentTopic.id);

      const child2 = await topicService.createTopic('Child 2', 'Child 2 Content', parentTopic.id);

      // Get hierarchy
      const hierarchy = await topicService.getTopicHierarchy(parentTopic.id);

      expect(hierarchy.children).toHaveLength(2);
      expect(hierarchy.children[0].id).toBe(child1.id);
      expect(hierarchy.children[1].id).toBe(child2.id);
    });

    it('should find shortest path between topics', async () => {
      // Create a chain of topics
      const topic1 = await topicService.createTopic('Topic 1', 'Content 1', null);
      const topic2 = await topicService.createTopic('Topic 2', 'Content 2', topic1.id);
      const topic3 = await topicService.createTopic('Topic 3', 'Content 3', topic2.id);

      // Find path
      const path = await topicService.findShortestPath(topic1.id, topic3.id);

      expect(path).toEqual([topic1.id, topic2.id, topic3.id]);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent topic retrieval', async () => {
      const result = await topicService.getLatestTopic('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle invalid topic updates', async () => {
      await expect(
        topicService.updateTopic('non-existent-id', 'New Name', 'New Content'),
      ).rejects.toThrow('Topic not found');
    });

    it('should validate topic data on creation', async () => {
      await expect(
        topicService.createTopic('', '', null), // Invalid: empty name and content
      ).rejects.toThrow('Invalid topic data');
    });
  });

  describe('Performance', () => {
    it('should handle multiple topics efficiently', async () => {
      const startTime = Date.now();
      const topics = await Promise.all(
        Array(100)
          .fill(null)
          .map((_, i) => topicService.createTopic(`Topic ${i}`, `Content ${i}`, null)),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(topics).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});
