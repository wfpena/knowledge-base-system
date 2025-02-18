import Database from 'better-sqlite3';
import { Topic } from '../models/Topic';
import { User } from '../models/User';
import { Resource } from '../models/Resource';
import { UserRole } from '../types';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    if (process.env.NODE_ENV === 'test') {
      this.db = new Database(':memory:');
    } else {
      this.db = new Database('./data/database.sqlite');
    }
    this.initializeTables();
  }

  private initializeTables() {
    // Topics table with current version
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        currentVersion INTEGER NOT NULL DEFAULT 1,
        parentTopicId TEXT,
        FOREIGN KEY (parentTopicId) REFERENCES topics(id)
      );

      CREATE TABLE IF NOT EXISTS topic_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topicId TEXT NOT NULL,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topicId) REFERENCES topics(id),
        UNIQUE(topicId, version)
      );
    `);

    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Resources table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        topicId TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (topicId) REFERENCES topics(id)
      )
    `);
  }

  // Topic methods
  async saveTopic(topic: Topic): Promise<void> {
    const db = this.db;

    try {
      // Start transaction
      db.exec('BEGIN');

      // Insert or update main topic record
      const topicStmt = db.prepare(`
        INSERT OR REPLACE INTO topics (id, name, content, currentVersion, parentTopicId)
        VALUES (?, ?, ?, ?, ?)
      `);

      // Insert version record
      const versionStmt = db.prepare(`
        INSERT INTO topic_versions (topicId, name, content, version)
        VALUES (?, ?, ?, ?)
      `);

      topicStmt.run(topic.id, topic.name, topic.content, topic.version, topic.parentTopicId);
      versionStmt.run(topic.id, topic.name, topic.content, topic.version);

      // Commit transaction
      db.exec('COMMIT');
    } catch (error) {
      // Rollback on error
      db.exec('ROLLBACK');
      throw error;
    }
  }

  async getTopicVersion(id: string, version: number): Promise<Topic | null> {
    const stmt = this.db.prepare(`
      SELECT tv.*, t.parentTopicId 
      FROM topic_versions tv
      JOIN topics t ON t.id = tv.topicId
      WHERE tv.topicId = ? AND tv.version = ?
    `);
    const row = stmt.get(id, version);
    return row ? this.rowToTopic(row) : null;
  }

  async getLatestTopic(id: string): Promise<Topic | null> {
    const stmt = this.db.prepare(`
      SELECT tv.*, t.parentTopicId
      FROM topics t
      JOIN topic_versions tv ON t.id = tv.topicId
      WHERE t.id = ? AND tv.version = t.currentVersion
    `);
    const row = stmt.get(id);
    return row ? this.rowToTopic(row) : null;
  }

  async getTopicVersions(id: string): Promise<Topic[]> {
    const stmt = this.db.prepare(`
      SELECT tv.*, t.parentTopicId
      FROM topic_versions tv
      JOIN topics t ON t.id = tv.topicId
      WHERE tv.topicId = ?
      ORDER BY tv.version DESC
    `);
    const rows = stmt.all(id);
    return rows.map(this.rowToTopic);
  }

  async getAllTopics(): Promise<Topic[]> {
    const stmt = this.db.prepare(`
      SELECT tv.*, t.parentTopicId
      FROM topics t
      JOIN topic_versions tv ON t.id = tv.topicId
      WHERE tv.version = t.currentVersion
    `);
    const rows = stmt.all();
    return rows.map(this.rowToTopic);
  }

  // User methods
  async saveUser(user: User): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, passwordHash, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      user.id,
      user.name,
      user.email,
      (user as any).passwordHash,
      user.role,
      user.createdAt.toISOString(),
      user.updatedAt.toISOString(),
    );
  }

  async getUser(id: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    const row = stmt.get(id);
    return row ? this.rowToUser(row) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    const row = stmt.get(email);
    return row ? this.rowToUser(row) : null;
  }

  // Resource methods
  async saveResource(resource: Resource): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO resources (id, topicId, url, description, type, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      resource.id,
      resource.topicId,
      resource.url,
      resource.description,
      resource.type,
      resource.createdAt.toISOString(),
      resource.updatedAt.toISOString(),
    );
  }

  async getResource(id: string): Promise<Resource | null> {
    const stmt = this.db.prepare('SELECT * FROM resources WHERE id = ? LIMIT 1');
    const row = stmt.get(id);
    return row ? this.rowToResource(row) : null;
  }

  async getResourcesByTopic(topicId: string): Promise<Resource[]> {
    const stmt = this.db.prepare('SELECT * FROM resources WHERE topicId = ?');
    const rows = stmt.all(topicId);
    return rows.map(this.rowToResource);
  }

  // Helper methods to convert DB rows to models
  private rowToTopic(row: any): Topic {
    return new Topic({
      id: row.topicId,
      name: row.name,
      content: row.content,
      version: row.version,
      parentTopicId: row.parentTopicId,
    });
  }

  private rowToUser(row: any): User {
    const user = new User({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      password: '', // Password hash is handled separately
    });
    (user as any).passwordHash = row.passwordHash;
    return user;
  }

  private rowToResource(row: any): Resource {
    return new Resource({
      id: row.id,
      topicId: row.topicId,
      url: row.url,
      description: row.description,
      type: row.type,
    });
  }

  // Utility methods
  async clearDatabase(): Promise<void> {
    this.db.exec('DELETE FROM topic_versions');
    this.db.exec('DELETE FROM topics');
    this.db.exec('DELETE FROM resources');
    this.db.exec('DELETE FROM users');
  }

  close(): void {
    this.db.close();
  }
}
