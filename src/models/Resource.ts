import { BaseEntity } from './BaseEntity';
import { IResource, ResourceType } from '../types';

export class Resource extends BaseEntity {
  topicId: string;
  url: string;
  description: string;
  type: ResourceType;

  constructor(data: Omit<IResource, 'createdAt' | 'updatedAt'>) {
    super(data.id);
    this.topicId = data.topicId;
    this.url = data.url;
    this.description = data.description;
    this.type = data.type;
  }

  validate(): boolean {
    return Boolean(this.topicId && this.url && this.description && this.type);
  }
}
