# Dynamic Knowledge Base System

This is a simple knowledge base system that allows you to create topics and resources.

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

## API Endpoints

All endpoints except `/auth/*` require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Default admin user

- Email: admin@admin.com
- Password: admin

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
└── index.ts # Application entry point

## Development

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Jest for testing

## Database

Currently the database is completely in-memory. Meaning objects are stored in simple JS objects.

### Database Schema

#### Topics Collection
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

#### Resources Collection
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

#### Users Collection
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

## Database

The project uses an in-memory database implementation for development and testing:

### Database Service
- Implements Map-based storage
- Supports versioning for topics
- Maintains referential integrity
- Provides ACID-like guarantees

### Collections
```typescript
// Topics
Map<string, Topic[]> // Key: topicId, Value: array of versions

// Users
Map<string, User> // Key: userId, Value: user

// Resources
Map<string, Resource> // Key: resourceId, Value: resource
```

### Data Persistence
- Currently in-memory only
- Data is cleared between server restarts
- Suitable for development and testing

To implement a different database:
1. Keep the DatabaseService interface
2. Create a new implementation (e.g., MongoDBService)
3. Update the dependency injection in app.ts

