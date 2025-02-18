import { Topic } from '../models/Topic';
import { DatabaseService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';

export class TopicService {
  constructor(private db: DatabaseService) {}

  async createTopic(
    name: string,
    content: string,
    parentTopicId: string | null = null,
  ): Promise<Topic> {
    const topic = new Topic({
      id: uuidv4(),
      name,
      content,
      version: 1,
      parentTopicId,
    });

    if (!topic.validate()) {
      throw new Error('Invalid topic data');
    }

    await this.db.saveTopic(topic);
    return topic;
  }

  async updateTopic(id: string, name: string, content: string): Promise<Topic> {
    const currentTopic = await this.db.getLatestTopic(id);
    if (!currentTopic) {
      throw new Error('Topic not found');
    }

    const newVersion = new Topic({
      id: currentTopic.id,
      name,
      content,
      version: currentTopic.version + 1,
      parentTopicId: currentTopic.parentTopicId,
    });

    await this.db.saveTopic(newVersion);
    return newVersion;
  }

  async getTopicsList(): Promise<Topic[]> {
    return this.db.getAllTopics();
  }

  async getTopicHierarchy(topicId: string): Promise<any> {
    const topic = await this.db.getLatestTopic(topicId);
    if (!topic) {
      throw new Error('Topic not found');
    }

    const allTopics = await this.db.getAllTopics();
    const children = allTopics.filter((t) => t.parentTopicId === topicId);

    const result = {
      ...topic,
      children: await Promise.all(children.map((child) => this.getTopicHierarchy(child.id))),
    };

    return result;
  }

  async findShortestPath(startTopicId: string, endTopicId: string): Promise<string[]> {
    const allTopics = await this.db.getAllTopics();
    const graph = new Map<string, string[]>();

    // Build adjacency list
    for (const topic of allTopics) {
      const connections: string[] = [];
      if (topic.parentTopicId) {
        connections.push(topic.parentTopicId);
      }
      const children = allTopics.filter((t) => t.parentTopicId === topic.id);
      connections.push(...children.map((c) => c.id));
      graph.set(topic.id, connections);
    }

    // BFS implementation
    const queue: string[][] = [[startTopicId]];
    const visited = new Set<string>([startTopicId]);

    while (queue.length > 0) {
      const path = queue.shift();
      if (!path) {
        continue;
      }
      const currentId = path[path.length - 1];

      if (currentId === endTopicId) {
        return path;
      }

      const neighbors = graph.get(currentId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return [];
  }

  async getLatestTopic(id: string) {
    const topic = await this.db.getLatestTopic(id);
    if (!topic) {
      return null;
    }
    return topic;
  }

  async getTopicVersion(id: string, version: number) {
    const topic = await this.db.getTopicVersion(id, version);
    if (!topic) {
      return null;
    }
    return topic;
  }
}
