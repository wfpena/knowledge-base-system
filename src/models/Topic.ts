import { BaseEntity } from './BaseEntity';

export class Topic extends BaseEntity {
  id: string;
  name: string;
  content: string;
  version: number;
  parentTopicId: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Topic>) {
    super(data.id || '');
    this.id = data.id || '';
    this.name = data.name || '';
    this.content = data.content || '';
    this.version = data.version || 1;
    this.parentTopicId = data.parentTopicId || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate(): boolean {
    return this.name.length > 0 && this.content.length > 0;
  }
}
