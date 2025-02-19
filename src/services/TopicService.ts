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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!topic.validate()) {
      throw new Error('Invalid topic data');
    }

    await this.db.createTopic(topic);
    return topic;
  }

  async updateTopic(id: string, name: string, content: string): Promise<Topic> {
    const currentTopic = await this.db.getLatestTopic(id);
    if (!currentTopic) {
      throw new Error(`Cannot update topic with id ${id} because it does not exist`);
    }

    const newVersion = new Topic({
      id: currentTopic.id,
      name,
      content,
      version: currentTopic.version + 1,
      parentTopicId: currentTopic.parentTopicId || null,
      createdAt: currentTopic.createdAt,
      updatedAt: new Date(),
    });

    await this.db.updateTopic(newVersion, currentTopic);

    return newVersion;
  }

  async getTopicsList(): Promise<Topic[]> {
    return this.db.getAllTopics();
  }

  // Recursive topic retrieval
  async getTopicHierarchy(topicId: string): Promise<any> {
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    const topic = await this.db.getLatestTopic(topicId);
    if (!topic) {
      throw new Error(`Topic with id ${topicId} not found`);
    }

    const children = await this.db.getTopicChildren(topicId);

    const result = {
      ...topic,
      children: await Promise.all(children.map((child) => this.getTopicHierarchy(child.id))),
    };

    return result;
  }

  async findShortestPath(startTopicId: string, endTopicId: string): Promise<string[]> {
    // BFS implementation
    const queue: string[][] = [[startTopicId]];
    const visited = new Set<string>([startTopicId]);

    while (queue.length > 0) {
      const path = queue.shift();
      if (!path) continue;
      const currentId = path[path.length - 1];

      if (currentId === endTopicId) {
        return path;
      }

      // Get connections only when needed
      const connections = await this.db.getTopicConnections(currentId);
      const neighbors = [...connections.childIds];
      if (connections.parentId) neighbors.push(connections.parentId);

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

  async getTopicVersion(id: string, version?: number) {
    const topic = await this.db.getTopicVersion(id, version);
    if (!topic) {
      return null;
    }
    return topic;
  }
}
