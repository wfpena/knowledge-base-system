import { Topic } from '../models/Topic';
import { User } from '../models/User';
import { Resource } from '../models/Resource';

export class DatabaseService {
  private topics: Map<string, Topic[]> = new Map(); // Key: topicId, Value: array of versions
  private users: Map<string, User> = new Map();
  private resources: Map<string, Resource> = new Map();

  async saveTopic(topic: Topic): Promise<void> {
    const existingVersions = this.topics.get(topic.id) || [];
    existingVersions.push(topic);
    this.topics.set(topic.id, existingVersions);
  }

  async getTopicVersion(id: string, version: number): Promise<Topic | null> {
    const versions = this.topics.get(id);
    if (!versions) return null;
    return versions.find((t) => t.version === version) || null;
  }

  async getLatestTopic(id: string): Promise<Topic | null> {
    const versions = this.topics.get(id);
    if (!versions || versions.length === 0) return null;
    return versions[versions.length - 1];
  }

  async getAllTopics(): Promise<Topic[]> {
    const latestVersions: Topic[] = [];
    for (const versions of this.topics.values()) {
      latestVersions.push(versions[versions.length - 1]);
    }
    return latestVersions;
  }

  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find((u) => u.email === email) || null;
  }

  async saveResource(resource: Resource): Promise<void> {
    this.resources.set(resource.id, resource);
  }

  async getResource(id: string): Promise<Resource | null> {
    return this.resources.get(id) || null;
  }

  async getResourcesByTopic(topicId: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter((r) => r.topicId === topicId);
  }
}
