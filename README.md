## Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests

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

# TODO change or implement
The project uses MongoDB as the primary database. Collections include:
- Topics (with version control)
- Resources
- Users
- Logs

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

