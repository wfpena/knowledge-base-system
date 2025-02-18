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
      expect(mockDb.createTopic).toHaveBeenCalledWith(createdTopic);
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
      expect(mockDb.updateTopic).toHaveBeenCalledWith(updatedTopic, existingTopic);
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
      mockDb.getTopicChildren.mockImplementation((id) => {
        if (id === 'parent') return Promise.resolve([childTopic]);
        return Promise.resolve([]);
      });

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

      await expect(topicService.getTopicHierarchy('123')).rejects.toThrow(
        'Topic with id 123 not found',
      );
    });
  });

  describe('findShortestPath', () => {
    it('should find path between topics', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: null, childIds: ['B'] });
        if (id === 'B') return Promise.resolve({ parentId: 'A', childIds: ['C'] });
        if (id === 'C') return Promise.resolve({ parentId: 'B', childIds: [] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'B', 'C']);
    });

    it('should return empty array when no path exists', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: null, childIds: [] });
        if (id === 'B') return Promise.resolve({ parentId: null, childIds: [] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

      const path = await topicService.findShortestPath('A', 'B');
      expect(path).toEqual([]);
    });

    it('should return the shortest path when a direct connection exists', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: null, childIds: ['B'] });
        if (id === 'B') return Promise.resolve({ parentId: 'A', childIds: ['C'] });
        if (id === 'C') return Promise.resolve({ parentId: 'B', childIds: [] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'B', 'C']);
    });

    it('should return an empty array when no path exists', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: null, childIds: ['B'] });
        if (id === 'B') return Promise.resolve({ parentId: 'A', childIds: [] });
        if (id === 'C') return Promise.resolve({ parentId: null, childIds: [] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual([]);
    });

    it('should return a single element array when start and end are the same', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: 'A', childIds: [] });
        if (id === 'B') return Promise.resolve({ parentId: 'B', childIds: ['A'] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

      const path = await topicService.findShortestPath('A', 'A');
      expect(path).toEqual(['A']);
    });

    it('should be able to handle complex cycles', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        const connections = {
          A: { parentId: null, childIds: ['B', 'C'] },
          B: { parentId: 'A', childIds: ['D'] },
          C: { parentId: 'A', childIds: ['E'] },
          D: { parentId: 'B', childIds: ['F'] },
          E: { parentId: 'C', childIds: ['G'] },
          F: { parentId: 'D', childIds: ['H'] },
          G: { parentId: 'E', childIds: ['I'] },
          H: { parentId: 'F', childIds: ['J'] },
          I: { parentId: 'G', childIds: ['K'] },
          J: { parentId: 'H', childIds: ['L'] },
          K: { parentId: 'I', childIds: ['M'] },
          L: { parentId: 'J', childIds: ['N'] },
          M: { parentId: 'K', childIds: ['O'] },
          N: { parentId: 'L', childIds: ['P'] },
          O: { parentId: 'M', childIds: ['Q'] },
          P: { parentId: 'N', childIds: ['R'] },
          Q: { parentId: 'O', childIds: ['S'] },
          R: { parentId: 'P', childIds: ['T'] },
          S: { parentId: 'Q', childIds: ['U'] },
          T: { parentId: 'R', childIds: [] },
          U: { parentId: 'S', childIds: [] },
        };
        return Promise.resolve(
          connections[id as keyof typeof connections] || { parentId: null, childIds: [] },
        );
      });

      const path = await topicService.findShortestPath('A', 'U');
      expect(path).toEqual(['A', 'C', 'E', 'G', 'I', 'K', 'M', 'O', 'Q', 'S', 'U']);
    });

    it('should be able to handle complex cycles - case 2', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        const connections = {
          A: { parentId: null, childIds: ['B', 'C'] },
          B: { parentId: 'A', childIds: ['D'] },
          C: { parentId: 'A', childIds: ['E'] },
          D: { parentId: 'B', childIds: ['F'] },
          E: { parentId: 'C', childIds: ['G'] },
          F: { parentId: 'D', childIds: ['H'] },
          G: { parentId: 'E', childIds: ['I'] },
          H: { parentId: 'F', childIds: ['J'] },
          I: { parentId: 'G', childIds: ['K'] },
          J: { parentId: 'H', childIds: ['L'] },
          K: { parentId: 'I', childIds: ['M'] },
          L: { parentId: 'J', childIds: ['N'] },
          M: { parentId: 'K', childIds: ['O'] },
          N: { parentId: 'L', childIds: ['P'] },
          O: { parentId: 'M', childIds: ['Q'] },
          P: { parentId: 'N', childIds: ['R'] },
          Q: { parentId: 'O', childIds: ['S'] },
          R: { parentId: 'P', childIds: ['T'] },
          S: { parentId: 'Q', childIds: ['U'] },
          T: { parentId: 'R', childIds: [] },
          U: { parentId: 'S', childIds: [] },
        };
        return Promise.resolve(
          connections[id as keyof typeof connections] || { parentId: null, childIds: [] },
        );
      });

      const path = await topicService.findShortestPath('P', 'R');
      expect(path).toEqual(['P', 'R']);
    });

    it('should be able to handle complex cycles - case 3', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        const connections = {
          A: { parentId: null, childIds: ['B', 'C'] },
          B: { parentId: 'A', childIds: ['D'] },
          C: { parentId: 'A', childIds: ['E'] },
          D: { parentId: 'B', childIds: ['F'] },
          E: { parentId: 'C', childIds: ['G'] },
          F: { parentId: 'D', childIds: ['H'] },
          G: { parentId: 'E', childIds: ['I'] },
          H: { parentId: 'F', childIds: ['J'] },
          I: { parentId: 'G', childIds: ['K'] },
          J: { parentId: 'H', childIds: ['L'] },
          K: { parentId: 'I', childIds: ['M'] },
          L: { parentId: 'J', childIds: ['N'] },
          M: { parentId: 'K', childIds: ['O'] },
          N: { parentId: 'L', childIds: ['P'] },
          O: { parentId: 'M', childIds: ['Q'] },
          P: { parentId: 'N', childIds: ['R'] },
          Q: { parentId: 'O', childIds: ['S'] },
          R: { parentId: 'P', childIds: ['T'] },
          S: { parentId: 'Q', childIds: ['U'] },
          T: { parentId: 'R', childIds: [] },
          U: { parentId: 'S', childIds: [] },
        };
        return Promise.resolve(
          connections[id as keyof typeof connections] || { parentId: null, childIds: [] },
        );
      });

      const path = await topicService.findShortestPath('K', 'G');
      expect(path).toEqual(['K', 'I', 'G']);
    });

    it('should handle cycles correctly', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: null, childIds: ['B', 'C'] });
        if (id === 'B') return Promise.resolve({ parentId: 'A', childIds: ['C'] });
        if (id === 'C') return Promise.resolve({ parentId: 'A', childIds: ['B'] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

      const path = await topicService.findShortestPath('A', 'C');
      expect(path).toEqual(['A', 'C']); // Shortest valid path
    });

    it('should return the shortest path in a more complex graph', async () => {
      mockDb.getTopicConnections.mockImplementation((id) => {
        if (id === 'A') return Promise.resolve({ parentId: null, childIds: ['B', 'C'] });
        if (id === 'B') return Promise.resolve({ parentId: 'A', childIds: ['D'] });
        if (id === 'C') return Promise.resolve({ parentId: 'A', childIds: ['E'] });
        if (id === 'D') return Promise.resolve({ parentId: 'B', childIds: ['F'] });
        if (id === 'E') return Promise.resolve({ parentId: 'C', childIds: ['F'] });
        if (id === 'F') return Promise.resolve({ parentId: 'D', childIds: ['G'] });
        return Promise.resolve({ parentId: null, childIds: [] });
      });

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
