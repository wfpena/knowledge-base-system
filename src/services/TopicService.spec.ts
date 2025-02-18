import { TopicService } from './TopicService';
import { DatabaseService } from './DatabaseService';
import { Topic } from '../models/Topic';

// Mock DatabaseService
jest.mock('./DatabaseService');

describe('TopicService', () => {
  let topicService: TopicService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockDb = new DatabaseService() as jest.Mocked<DatabaseService>;
    topicService = new TopicService(mockDb);
  });

  describe('createTopic', () => {
    it('should create a valid topic', async () => {
      const topicData = {
        name: 'Test Topic',
        content: 'Test Content',
        parentTopicId: null,
      };

      const createdTopic = await topicService.createTopic(
        topicData.name,
        topicData.content,
        topicData.parentTopicId,
      );

      expect(createdTopic).toBeInstanceOf(Topic);
      expect(createdTopic.name).toBe(topicData.name);
      expect(createdTopic.content).toBe(topicData.content);
      expect(createdTopic.parentTopicId).toBe(topicData.parentTopicId);
      expect(createdTopic.version).toBe(1);
      expect(mockDb.saveTopic).toHaveBeenCalledWith(createdTopic);
    });

    it('should throw error for invalid topic data', async () => {
      const topicData = {
        name: '', // Invalid: empty name
        content: 'Test Content',
        parentTopicId: null,
      };

      await expect(
        topicService.createTopic(topicData.name, topicData.content, topicData.parentTopicId),
      ).rejects.toThrow('Invalid topic data');
    });
  });

  describe('updateTopic', () => {
    it('should update an existing topic', async () => {
      const existingTopic = new Topic({
        id: '123',
        name: 'Old Name',
        content: 'Old Content',
        version: 1,
        parentTopicId: null,
      });

      mockDb.getLatestTopic.mockResolvedValue(existingTopic);

      const updatedTopic = await topicService.updateTopic('123', 'New Name', 'New Content');

      expect(updatedTopic.id).toBe(existingTopic.id);
      expect(updatedTopic.name).toBe('New Name');
      expect(updatedTopic.content).toBe('New Content');
      expect(updatedTopic.version).toBe(2);
      expect(mockDb.saveTopic).toHaveBeenCalledWith(updatedTopic);
    });

    it('should throw error when topic not found', async () => {
      mockDb.getLatestTopic.mockResolvedValue(null);

      await expect(topicService.updateTopic('123', 'New Name', 'New Content')).rejects.toThrow(
        'Topic not found',
      );
    });
  });

  describe('getTopicHierarchy', () => {
    it('should return topic hierarchy', async () => {
      const parentTopic = new Topic({
        id: 'parent',
        name: 'Parent',
        content: 'Parent Content',
        version: 1,
        parentTopicId: null,
      });

      const childTopic = new Topic({
        id: 'child',
        name: 'Child',
        content: 'Child Content',
        version: 1,
        parentTopicId: 'parent',
      });

      mockDb.getLatestTopic.mockImplementation((id) => {
        if (id === 'parent') return Promise.resolve(parentTopic);
        if (id === 'child') return Promise.resolve(childTopic);
        return Promise.resolve(null);
      });
      mockDb.getAllTopics.mockResolvedValue([parentTopic, childTopic]);

      const hierarchy = await topicService.getTopicHierarchy('parent');

      expect(hierarchy.id).toBe(parentTopic.id);
      expect(hierarchy).toEqual({
        ...parentTopic,
        children: [
          {
            ...childTopic,
            children: [],
          },
        ],
      });
    });

    it('should throw error when topic not found', async () => {
      mockDb.getLatestTopic.mockResolvedValue(null);

      await expect(topicService.getTopicHierarchy('123')).rejects.toThrow('Topic not found');
    });
  });

  describe('findShortestPath', () => {
    it('should find path between topics', async () => {
      const topics = [
        new Topic({ id: 'A', name: 'A', content: 'A', version: 1, parentTopicId: null }),
        new Topic({ id: 'B', name: 'B', content: 'B', version: 1, parentTopicId: 'A' }),
        new Topic({ id: 'C', name: 'C', content: 'C', version: 1, parentTopicId: 'B' }),
      ];

      mockDb.getAllTopics.mockResolvedValue(topics);

      const path = await topicService.findShortestPath('A', 'C');

      expect(path).toEqual(['A', 'B', 'C']);
    });

    it('should return empty array when no path exists', async () => {
      const topics = [
        new Topic({ id: 'A', name: 'A', content: 'A', version: 1, parentTopicId: null }),
        new Topic({ id: 'B', name: 'B', content: 'B', version: 1, parentTopicId: null }),
      ];

      mockDb.getAllTopics.mockResolvedValue(topics);

      const path = await topicService.findShortestPath('A', 'B');

      expect(path).toEqual([]);
    });
  });

  describe('getTopicsList', () => {
    it('should return all topics', async () => {
      const topics = [
        new Topic({
          id: '1',
          name: 'Topic 1',
          content: 'Content 1',
          version: 1,
          parentTopicId: null,
        }),
        new Topic({
          id: '2',
          name: 'Topic 2',
          content: 'Content 2',
          version: 1,
          parentTopicId: '1',
        }),
      ];

      mockDb.getAllTopics.mockResolvedValue(topics);

      const result = await topicService.getTopicsList();

      expect(result).toEqual(topics);
      expect(mockDb.getAllTopics).toHaveBeenCalled();
    });
  });
});
