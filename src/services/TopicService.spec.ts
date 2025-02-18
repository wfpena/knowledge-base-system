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

    it('should return the shortest path when a direct connection exists', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: 'B' },
      ] as Topic[]);

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'B', 'C']);
    });

    it('should return an empty array when no path exists', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: null }, // Disconnected
      ] as Topic[]);

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual([]);
    });

    it('should return a single element array when start and end are the same', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
      ] as Topic[]);

      const path = await topicService.findShortestPath('A', 'A');
      expect(path).toEqual(['A']);
    });

    it('should be able to handle complex cycles', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: 'A' },
        { id: 'D', parentTopicId: 'B' },
        { id: 'E', parentTopicId: 'C' },
        { id: 'F', parentTopicId: 'D' },
        { id: 'G', parentTopicId: 'E' },
        { id: 'H', parentTopicId: 'F' },
        { id: 'I', parentTopicId: 'G' },
        { id: 'J', parentTopicId: 'H' },
        { id: 'K', parentTopicId: 'I' },
        { id: 'L', parentTopicId: 'J' },
        { id: 'M', parentTopicId: 'K' },
        { id: 'N', parentTopicId: 'L' },
        { id: 'O', parentTopicId: 'M' },
        { id: 'P', parentTopicId: 'N' },
        { id: 'Q', parentTopicId: 'O' },
        { id: 'R', parentTopicId: 'P' },
        { id: 'S', parentTopicId: 'Q' },
        { id: 'T', parentTopicId: 'R' },
        { id: 'U', parentTopicId: 'S' },
      ] as Topic[]);

      const path = await topicService.findShortestPath('A', 'U');
      expect(path).toEqual(['A', 'C', 'E', 'G', 'I', 'K', 'M', 'O', 'Q', 'S', 'U']);
    });

    it('should be able to handle complex cycles - case 2', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: 'A' },
        { id: 'D', parentTopicId: 'B' },
        { id: 'E', parentTopicId: 'C' },
        { id: 'F', parentTopicId: 'D' },
        { id: 'G', parentTopicId: 'E' },
        { id: 'H', parentTopicId: 'F' },
        { id: 'I', parentTopicId: 'G' },
        { id: 'J', parentTopicId: 'H' },
        { id: 'K', parentTopicId: 'I' },
        { id: 'L', parentTopicId: 'J' },
        { id: 'M', parentTopicId: 'K' },
        { id: 'N', parentTopicId: 'L' },
        { id: 'O', parentTopicId: 'M' },
        { id: 'P', parentTopicId: 'N' },
        { id: 'Q', parentTopicId: 'O' },
        { id: 'R', parentTopicId: 'P' },
        { id: 'S', parentTopicId: 'Q' },
        { id: 'T', parentTopicId: 'R' },
        { id: 'U', parentTopicId: 'S' },
      ] as Topic[]);

      const path = await topicService.findShortestPath('P', 'R');
      expect(path).toEqual(['P', 'R']);
    });

    it('should be able to handle complex cycles - case 3', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: 'A' },
        { id: 'D', parentTopicId: 'B' },
        { id: 'E', parentTopicId: 'C' },
        { id: 'F', parentTopicId: 'D' },
        { id: 'G', parentTopicId: 'E' },
        { id: 'H', parentTopicId: 'F' },
        { id: 'I', parentTopicId: 'G' },
        { id: 'J', parentTopicId: 'H' },
        { id: 'K', parentTopicId: 'I' },
        { id: 'L', parentTopicId: 'J' },
        { id: 'M', parentTopicId: 'K' },
        { id: 'N', parentTopicId: 'L' },
        { id: 'O', parentTopicId: 'M' },
        { id: 'P', parentTopicId: 'N' },
        { id: 'Q', parentTopicId: 'O' },
        { id: 'R', parentTopicId: 'P' },
        { id: 'S', parentTopicId: 'Q' },
        { id: 'T', parentTopicId: 'R' },
        { id: 'U', parentTopicId: 'S' },
      ] as Topic[]);

      const path = await topicService.findShortestPath('K', 'G');
      expect(path).toEqual(['K', 'I', 'G']);
    });

    it('should handle cycles correctly', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: 'B' },
        { id: 'A', parentTopicId: 'C' }, // Cycle!
      ] as Topic[]);

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'C']); // Shortest valid path
    });

    it('should return the shortest path in a more complex graph', async () => {
      mockDb.getAllTopics.mockResolvedValue([
        { id: 'A', parentTopicId: null },
        { id: 'B', parentTopicId: 'A' },
        { id: 'C', parentTopicId: 'A' },
        { id: 'D', parentTopicId: 'B' },
        { id: 'E', parentTopicId: 'C' },
        { id: 'F', parentTopicId: 'D' },
        { id: 'F', parentTopicId: 'E' }, // Two paths to F
      ] as Topic[]);

      const path = await topicService.findShortestPath('A', 'F');
      expect(path).toEqual(['A', 'B', 'D', 'F']); // Shortest path
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
