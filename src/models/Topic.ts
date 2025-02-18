import { BaseEntity } from './BaseEntity';
import { ITopic } from '../types';

export class Topic extends BaseEntity {
  name: string;
  content: string;
  version: number;
  parentTopicId: string | null;

  constructor(data: Omit<ITopic, 'createdAt' | 'updatedAt'>) {
    super(data.id);
    this.name = data.name;
    this.content = data.content;
    this.version = data.version;
    this.parentTopicId = data.parentTopicId;
  }

  validate(): boolean {
    return Boolean(this.name && this.content && this.version >= 0);
  }
}
