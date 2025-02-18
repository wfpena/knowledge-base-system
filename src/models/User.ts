import { BaseEntity } from './BaseEntity';
import { IUser, UserRole } from '../types';
import bcrypt from 'bcrypt';

export class User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  private passwordHash: string;

  constructor(data: Omit<IUser, 'createdAt'> & { password: string }) {
    super(data.id);
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.passwordHash = bcrypt.hashSync(data.password, 10);
  }

  validate(): boolean {
    if (!this.name) {
      throw new Error('Name is required');
    }
    if (!this.email) {
      throw new Error('Email is required');
    }
    if (!this.email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (!this.validateRole()) {
      throw new Error('Invalid role');
    }
    return true;
  }

  validateRole(): boolean {
    if (
      this.role !== UserRole.ADMIN &&
      this.role !== UserRole.EDITOR &&
      this.role !== UserRole.VIEWER
    ) {
      throw new Error('Invalid role');
    }
    return true;
  }

  verifyPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.passwordHash);
  }
}
