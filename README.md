# Dynamic Knowledge Base System

This is a simple knowledge base system that allows you to create topics and resources.

## Setup Development Environment

1. Clone the repository
2. Install dependencies
  ```bash
  npm install
  ```
3. Create a `.env` file in the root directory (using `.env.example` as a template)
  ```bash
  cp .env.example .env
  ```
4. Start the server
  ```bash
  npm run dev
  ```
4. Open the app in your browser
  ```bash
  http://localhost:3016
  ```

## Setup Production Environment

1. Create a `.env` file in the root directory (using `.env.example` as a template)
  ```bash
  cp .env.example .env
  ```
2. Set the `NODE_ENV` environment variable to `production`
  ```bash
  NODE_ENV=production
  ```
3. Start the server
  ```bash
  npm start
  ```

## Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:integration` - Run only integration tests
- `npm run test:debug` - Debug tests with Node inspector


---

## Environment Variables

- `NODE_ENV` - Set to `development` or `production`
- `DB_PATH` - Path to the database file - for in-memory database, use `:memory:`
- `JWT_SECRET` - Secret key for JWT
- `PORT` - Port to run the server on


## Testing

- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:integration` - Run only integration tests
- `npm run test:debug` - Debug tests with Node inspector

---

## API Endpoints

All endpoints except `/auth/*` require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authentication

Authentication is handled by JWT tokens.

- `POST /auth/register` - Register a new user
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
  Response:
  ```json
  {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "VIEWER"
  }
  ```

- `POST /auth/login` - Login and get JWT token
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
  Response:
  ```json
  {
    "token": "jwt_token_string"
  }
  ```

### Topics

- `POST /topics` - Create a new topic
  ```json
  {
    "name": "Topic Name",
    "content": "Topic Content",
    "parentTopicId": "optional-parent-id"
  }
  ```

- `PUT /topics/:id` - Update a topic
  ```json
  {
    "name": "Updated Name",
    "content": "Updated Content"
  }
  ```

- `GET /topics/:id` - Get a topic
  - Query params: `version` (optional) - Get specific version

- `GET /topics/:id/hierarchy` - Get topic hierarchy

- `GET /topics/:startId/path/:endId` - Find shortest path between topics

- `GET /topics/list` - Returns a list with all topics

## Project Structure
```
src/
├── controllers/ # Request handlers
├── models/ # Data models
├── services/ # Business logic
├── types/ # TypeScript types and interfaces
├── tests/ # Integration tests
├── config/ # Configuration
└── index.ts # Application entry point
```

---

## Finding the Shortest Path Between Topics

### Overview

The `findShortestPath` function finds the shortest path between two topics in a hierarchical structure using Breadth-First Search (BFS). This is useful when topics are organized as a directed graph, where each topic may have a parent and multiple children.

Endpoint:
```
GET /topics/:startId/path/:endId
```

### Algorithm Explanation

1. Initialize BFS
  - Starts from startTopicId and uses a queue to track paths.
  - Uses a visited set to avoid cycles.
2. Expand Paths Dynamically
  - At each step, it retrieves topic connections (parentId and childIds) using this.db.getTopicConnections(currentId).
  - Adds unvisited neighbors to the queue, extending the path.
3. Find the Shortest Path
  - If endTopicId is reached, returns the shortest path.
  - If no path exists, returns an empty array.

### Complexity Analysis
- Time Complexity: O(N + E), where N is the number of topics and E is the number of connections.
- Space Complexity: O(N) for the visited set and queue.


## Topics Versioning

This versioning system maintains a history of topic updates by storing each modification as a new version while preserving the previous state in a separate table (`topic_versions`).

How It Works
1. Retrieve Latest Version
  - `getLatestTopic(id)` fetches the most recent version of the topic.
  - If the topic does not exist, an error is thrown.
2. Create a New Version
  - A new topic version is created with an incremented version number.
  - The updatedAt timestamp is set to the current time.
3. Database Update (Transactional)
  - Main topics table: Updates the current topic with the latest changes.
  - topic_versions table: Stores the previous version before updating.
  - A transaction ensures consistency (BEGIN, COMMIT, ROLLBACK on failure).

Benefits
- Full History Tracking – Each update is logged, enabling rollback or auditing.
- Data Integrity – Transactions prevent partial updates.
- Simple Retrieval – The latest topic remains in the topics table for fast access.


---

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Jest for testing

## Database

This project uses `better-sqlite3` for database operations. Note that:
- All SQLite operations are **synchronous/blocking** by design
- **This is intentional** and makes `better-sqlite3` faster than other SQLite implementations
- The codebase maintains **async/await** patterns for:
  - Interface consistency
  - Future compatibility with other databases
  - Error handling patterns

For more details, see the [better-sqlite3 documentation](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#class-database).

Data is currently stored in the `data` directory.
- Change the `DB_PATH` in the `.env` file to use a different path.
- Suitable for development and testing

### Schema

The database is a simple sqlite database with four tables: `topics`, `topic_versions`, `resources`, and `users`.

### Tables Overview

#### `topics` (Main Topics Table)
  - Stores the latest version of each topic.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | TEXT | PRIMARY KEY | Unique identifier for the topic. |
| name | TEXT | NOT NULL | Topic name. |
| content | TEXT | NOT NULL | Topic content. |
| currentVersion | INTEGER | NOT NULL, DEFAULT 1 | Tracks the latest version of the topic. |
| parentTopicId | TEXT | NULL, FOREIGN KEY | Links to a parent topic (if hierarchical). |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp. |
| updatedAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification timestamp. |

Purpose:
  - Stores only the latest version of each topic.
  - Allows hierarchical relationships with parentTopicId.


#### `topic_versions` (Topic Versioning Table)
  - Stores historical versions of topics for tracking changes.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique version entry ID. |
| topicId | TEXT | NOT NULL, FOREIGN KEY | Links to the topics table. |
| name | TEXT | NOT NULL | Topic name at this version. |
| content | TEXT | NOT NULL | Topic content at this version. |
| version | INTEGER | NOT NULL | Version number of the topic. |
| parentTopicId | TEXT | NULL, FOREIGN KEY | Parent topic (if applicable). |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp when this version was created. |

Purpose:
  - Preserves past versions of topics.
  - Ensures unique versioning per topic with UNIQUE(topicId, version).


#### `users` (User Authentication Table)
  - Stores user credentials and roles.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | TEXT | PRIMARY KEY | Unique user ID. |
| name | TEXT | NOT NULL | User's full name. |
| email | TEXT | UNIQUE, NOT NULL | User's email (must be unique). |
| passwordHash | TEXT | NOT NULL | Encrypted password hash. |
| role | TEXT | NOT NULL | User role (e.g., admin, editor, viewer). |
| createdAt | TEXT | NOT NULL | Account creation timestamp. |
| updatedAt | TEXT | NOT NULL | Last update timestamp. |

Purpose:
  - Manages user authentication and authorization.
  - Enforces unique email addresses.


#### `resources` (External Resources Table)
  - Links additional learning materials to topics.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | TEXT | PRIMARY KEY | Unique resource ID. |
| topicId | TEXT | NOT NULL, FOREIGN KEY | Links the resource to a topic. |
| url | TEXT | NOT NULL | Resource link (e.g., article, video). |
| description | TEXT | NOT NULL | Brief description of the resource. |
| type | TEXT | NOT NULL | Type of resource (e.g., video, article). |
| createdAt | TEXT | NOT NULL | Timestamp when the resource was added. |
| updatedAt | TEXT | NOT NULL | Timestamp of the last update. |

Purpose:
  - Associates external resources (articles, videos) with topics.
  - Allows filtering by resource type.

> See the `src/models` directory for the full definitions of the models.
> And go here for the [DatabaseService](src/services/DatabaseService.ts) implementation of the database and DDL statements.

## Authentication & Authorization

### Default Admin Account
The system creates a default admin user on startup:
- Email: admin@admin.com
- Password: admin

It is highly recommended to change these credentials in production.

The system implements role-based access control (RBAC) with the following roles:

### User Roles

- **Admin**: Full system access
  - Can manage users
  - Can perform all operations on topics and resources
  - Can view system logs
- **Editor**: Content management access
  - Can create and edit topics
  - Can manage resources
  - Cannot manage users
- **Viewer**: Read-only access
  - Can view topics and resources
  - Cannot make any modifications

### Authentication
- JWT-based authentication
- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days

### API Security
All endpoints except authentication endpoints require a valid JWT token.


## SOLID Principles

The project implements the SOLID principles to ensure a clean and maintainable codebase.

### Single Responsibility Principle

Each component follows the Single Responsibility Principle:

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic
- **Models**: Define data structures and validation
- **Repositories**: Handle data persistence

### Open/Closed Principle
The system is designed to be extendable without requiring modifications to existing code:

- **AuthService**: This service is open for extension but closed for modification.
  - Example: New authentication methods can be added by extending the class or interface without altering the existing codebase.

- **BaseEntity**: Provide a foundation for creating new models by extending them, ensuring that the existing models are unaffected by new implementations.

- **Logger**: Components like Logger are designed using interfaces, allowing new logging methods or strategies to be implemented without changing the existing logging infrastructure.

  - Example: Adding a new log provider like Winston without needing to modify the base logging logic.


### Liskov Substitution Principle
Subtypes can be substituted for their base types:
- All models extend `BaseEntity`
- Different logger implementations follow the `Logger` interface
- Services depend on abstractions rather than concrete implementations

### Interface Segregation Principle
Interfaces are kept focused and minimal:
- `Logger` interface defines only essential logging methods
- Controllers expose only necessary endpoints
- Services have clearly defined boundaries

### Dependency Inversion Principle
High-level modules depend on abstractions:
- Services accept interfaces rather than concrete implementations
- Dependency injection used throughout the application

### Potential Improvements

1. **Database Service Separation** (*Single Responsibility Principle (SRP)* and *Dependency Inversion Principle (DIP)*):
   - Split `DatabaseService` into separate repositories (TopicRepository, UserRepository)
   - Create a Repository interface for each entity
   - Implement different storage backends (SQL, NoSQL) behind same interface

2. **Service Layer Refinement**:
   - Further separate business logic from data access
   - Create dedicated DTOs for service layer
   - Add domain events for better decoupling

3. **Controller Enhancement**:
   - Implement request/response DTOs
   - Add validation middleware
   - Separate route configuration from controllers


## Logging

The system implements comprehensive logging using Winston:

### Log Levels
- **ERROR**: Application errors and exceptions
- **WARN**: Warning conditions
- **INFO**: General operational information
- **DEBUG**: Detailed debugging information

### Log Categories
- **Access Logs**: HTTP request/response details
- **Audit Logs**: User actions and system changes
- **Error Logs**: Application errors and exceptions
- **Performance Logs**: API response times and resource usage

Logs are stored in:
- Console (development environment)
- Files (production environment)
- MongoDB (for audit logs)

## Testing

The project uses Jest for both unit and integration testing:

### Unit Tests
- Located in `src/**/*.spec.ts`
- Test individual components in isolation
- Mock external dependencies

### Integration Tests
- Located in `src/tests/integration/*.integration.spec.ts`
- Test complete API flows
- Use Supertest to make HTTP requests
- Test authentication and authorization

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Test Coverage
Coverage reports are generated in the `coverage` directory and include:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

> The generated coverage report is in HTML format and can be viewed by opening the `index.html` file in the `coverage` directory.

---


## NOTES: Frontend and admin user

Currently if you open `http://localhost:3016` you will see a draft playground screen for calling the API.

It is served from the `public` directory.

The admin user is pre-created on startup and the credentials are:

- Email: admin@admin.com
- Password: admin

> The frontend is a draft and used for initial testing and development.
