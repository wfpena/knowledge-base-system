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


### Default Admin User

The system creates a default admin user on startup:

- Email: admin@admin.com
- Password: admin


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

src/
├── controllers/ # Request handlers
├── models/ # Data models
├── services/ # Business logic
├── types/ # TypeScript types and interfaces
├── tests/ # Integration tests
├── config/ # Configuration
└── index.ts # Application entry point


---

## Finding the Shortest Path Between Topics

### Overview

The `findShortestPath` function finds the shortest path between two topics in a hierarchical structure using Breadth-First Search (BFS). This is useful when topics are organized as a directed graph, where each topic may have a parent and multiple children.

Endpoint:
```
GET /topics/:startId/path/:endId
```

### Algorithm Explanation
Build a Graph (Adjacency List)

- Fetches all topics from the database.
- Constructs a graph representation where each topic is a node.
- Each node connects to its parent (if it has one) and its children (topics where it is the parent).

Perform BFS to Find the Shortest Path

- Uses a queue to explore topics level by level, ensuring the shortest path is found first.
- Tracks visited topics to avoid cycles and redundant searches.
- Stops when the endTopicId is reached, returning the shortest path.

### Complexity Analysis
- Graph Construction: O(N²) (due to filtering for children, can be optimized with a map).
- BFS Traversal: O(N + E) (where N is the number of topics and E is the number of connections).
- Overall Complexity: ~O(N²) in the worst case.

---

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Jest for testing

## Database

This project uses `better-sqlite3` for database operations. Note that:
- All SQLite operations are synchronous/blocking by design
- This is intentional and makes `better-sqlite3` faster than other SQLite implementations
- The codebase maintains async/await patterns for:
  - Interface consistency
  - Future compatibility with other databases
  - Error handling patterns

For more details, see the [better-sqlite3 documentation](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#class-database).

Data is currently stored in the `data` directory.
- Change the `DB_PATH` in the `.env` file to use a different path.
- Suitable for development and testing

### Schema

The database is a simple sqlite database with four tables: `topics`, `topic_versions`, `resources`, and `users`.

Its relational structure is as follows:

#### Topics
```json
{
  "_id": "ObjectId",
  "name": "string",
  "content": "string",
  "version": "number",
  "parentTopicId": "ObjectId | null",
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "ObjectId"
}
```

#### Topic Versions
```json
{
  "_id": "ObjectId",
  "topicId": "ObjectId",
  "url": "string",
  "description": "string",
  "type": "enum['video', 'article', 'pdf']",
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdBy": "ObjectId"
}
```

#### Users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "role": "enum['admin', 'editor', 'viewer']",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

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
