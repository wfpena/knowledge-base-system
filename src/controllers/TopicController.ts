import { Request, Response } from 'express';
import { TopicService } from '../services/TopicService';
import { Logger } from '../types/Logger';

// TODO: Add error handling globally
// TODO: Add DTOs
export class TopicController {
  constructor(private topicService: TopicService, private logger: Logger) {}

  async createTopic(req: Request, res: Response) {
    try {
      const { name, content, parentTopicId } = req.body;
      this.logger.info('Creating new topic', { name, parentTopicId });
      const topic = await this.topicService.createTopic(name, content, parentTopicId);
      res.status(201).json(topic);
    } catch (error) {
      this.logger.error('Failed to create topic', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, content } = req.body;
      const topic = await this.topicService.updateTopic(id, name, content);
      res.json(topic);
    } catch (error) {
      this.logger.error('Failed to update topic', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getTopic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { version } = req.query;
      const topic = version
        ? await this.topicService.getTopicVersion(id, Number(version))
        : await this.topicService.getLatestTopic(id);

      if (!topic) {
        return res.status(404).json({ error: 'Topic not found' });
      }
      res.json(topic);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getTopicsList(req: Request, res: Response) {
    try {
      const topics = await this.topicService.getTopicsList();
      res.json(topics);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async getTopicHierarchy(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const hierarchy = await this.topicService.getTopicHierarchy(id);
      res.json(hierarchy);
    } catch (error) {
      this.logger.error('Failed to get topic hierarchy', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async findPath(req: Request, res: Response) {
    try {
      const { startId, endId } = req.params;
      const path = await this.topicService.findShortestPath(startId, endId);
      res.json(path);
    } catch (error) {
      this.logger.error('Failed to find path', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
}
