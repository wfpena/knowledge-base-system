import { Topic } from './Topic';

export class TopicVersion {
  id: number;
  topicId: string;
  name: string;
  content: string;
  version: number;
  parentTopicId: string | null;
  createdAt: Date;

  constructor(data: Partial<TopicVersion>) {
    this.id = data.id || 0;
    this.topicId = data.topicId || '';
    this.name = data.name || '';
    this.content = data.content || '';
    this.version = data.version || 1;
    this.parentTopicId = data.parentTopicId || null;
    this.createdAt = data.createdAt || new Date();
  }

  toTopic(): Topic {
    return new Topic({
      id: this.topicId,
      name: this.name,
      content: this.content,
      version: this.version,
      parentTopicId: this.parentTopicId,
    });
  }
}
