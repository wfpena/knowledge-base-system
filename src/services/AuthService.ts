import jwt from 'jsonwebtoken';
import { DatabaseService } from './DatabaseService';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../types';
import { config } from '../config';
import { Logger } from '../types/Logger';

export class AuthService {
  constructor(private db: DatabaseService, private logger: Logger) {}

  async register(name: string, email: string, password: string): Promise<User> {
    const existingUser = await this.db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = new User({
      id: uuidv4(),
      name,
      email,
      // Registers as a viewer by default
      role: UserRole.VIEWER,
      password,
    });

    if (!user.validate()) {
      throw new Error('Invalid user data');
    }

    await this.db.saveUser(user);
    return user;
  }

  async login(email: string, password: string): Promise<string> {
    const user = await this.db.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.verifyPassword(password)) {
      throw new Error('Invalid password');
    }

    return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
  }

  async addDefaultUser() {
    const existingAdmin = await this.db.getUserByEmail('admin@admin.com');
    if (existingAdmin) {
      return;
    }

    const adminUser = new User({
      id: '1',
      name: 'Admin',
      email: 'admin@admin.com',
      role: UserRole.ADMIN,
      password: 'admin',
    });

    try {
      await this.db.saveUser(adminUser);
      this.logger.info('Default admin user created');
    } catch (error) {
      this.logger.error('Error creating default admin:', error);
    }
  }

  async getUserByToken(token: string): Promise<User | null> {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    return this.db.getUser(decoded.id);
  }
}
