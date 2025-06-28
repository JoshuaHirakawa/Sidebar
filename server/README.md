# Sidebar Backend API

AI-powered backend for the Sidebar system design interview practice tool.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- OpenAI API key

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sidebar_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# AI Provider Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4-turbo-preview
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE sidebar_db;
```

Run the migration:

```bash
npm run db:migrate
```

### 4. Start the Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

### Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Chat Endpoints

#### Create Chat Session
```http
POST /api/chat/sessions
Content-Type: application/json

{
  "projectId": "uuid-of-project"
}
```

#### Send Message
```http
POST /api/chat/sessions/:sessionId/messages
Content-Type: application/json

{
  "content": "How should I design this system?",
  "boardContext": {
    "nodes": [...],
    "edges": [...]
  }
}
```

#### Get Session
```http
GET /api/chat/sessions/:sessionId
```

#### Get Project Sessions
```http
GET /api/chat/projects/:projectId/sessions
```

#### Get Project Stats
```http
GET /api/chat/projects/:projectId/stats
```

#### Delete Session
```http
DELETE /api/chat/sessions/:sessionId
```

#### Health Check
```http
GET /api/chat/health
```

### Health Check

```http
GET /health
```

## 🏗️ Architecture

### Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection & pooling
│   ├── controllers/
│   │   └── chatController.js    # Chat API logic
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── models/
│   │   └── chatModel.js         # Database operations
│   ├── routes/
│   │   └── chatRoutes.js        # API route definitions
│   ├── services/
│   │   └── aiService.js         # OpenAI integration
│   └── index.js                 # Main server application
├── db/
│   └── schema.sql               # Database schema
├── logs/                        # Application logs
├── package.json
└── README.md
```

### Key Design Decisions

#### 1. **Database Connection Pooling**
- **Choice**: PostgreSQL with connection pooling
- **Trade-off**: More memory usage, but prevents connection exhaustion
- **Alternative**: Single connections (simpler but doesn't scale)

#### 2. **JWT Authentication**
- **Choice**: JWT with database validation
- **Trade-off**: Extra database query, but prevents issues with deleted users
- **Alternative**: JWT-only (faster but less secure)

#### 3. **AI Service Integration**
- **Choice**: OpenAI with comprehensive error handling
- **Trade-off**: Vendor lock-in, but most reliable and feature-rich
- **Alternative**: Multiple AI providers (more complex but flexible)

#### 4. **Rate Limiting**
- **Choice**: Express-rate-limit with configurable settings
- **Trade-off**: Additional dependency, but essential for production
- **Alternative**: Custom implementation (more control but error-prone)

#### 5. **Logging**
- **Choice**: Winston with file and console outputs
- **Trade-off**: More setup, but essential for debugging and monitoring
- **Alternative**: console.log (simpler but not production-ready)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `sidebar_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `AI_MODEL` | AI model to use | `gpt-4-turbo-preview` |
| `AI_MAX_TOKENS` | Max tokens per response | `2000` |
| `AI_TEMPERATURE` | AI creativity level | `0.7` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `LOG_LEVEL` | Logging level | `info` |

### Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `projects` - System design projects
- `components` - Components placed on the design board
- `connections` - Relationships between components
- `chat_sessions` - AI interview sessions
- `chat_messages` - Conversation messages
- `scratch_notes` - User notes and scratchpad

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set all required environment variables
2. **Database**: Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
3. **SSL**: Enable SSL for database connections
4. **Logging**: Configure log aggregation (ELK stack, CloudWatch, etc.)
5. **Monitoring**: Set up application monitoring (New Relic, DataDog, etc.)
6. **Rate Limiting**: Consider Redis-based rate limiting for scalability
7. **Caching**: Add Redis for session storage and caching

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing

Test the API endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:3001/health

# AI service health
curl http://localhost:3001/api/chat/health
```

### Automated Testing

```bash
npm test
```

## 📊 Monitoring

### Logs

Logs are written to:
- `logs/error.log` - Error-level logs
- `logs/combined.log` - All logs
- Console (development only)

### Health Checks

- `/health` - Basic server health
- `/api/chat/health` - AI service health

### Metrics

Consider adding:
- Request/response times
- Database query performance
- AI API usage and costs
- Error rates and types

## 🔒 Security

### Implemented Security Measures

1. **Helmet.js** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Rate Limiting** - Prevent abuse
4. **Input Validation** - Sanitize user input
5. **JWT Authentication** - Secure API access
6. **SQL Injection Prevention** - Parameterized queries
7. **Error Handling** - Don't leak sensitive information

### Additional Recommendations

1. **HTTPS** - Use SSL/TLS in production
2. **API Keys** - Rotate OpenAI API keys regularly
3. **Database Security** - Use strong passwords and network security
4. **Monitoring** - Set up security event monitoring
5. **Backups** - Regular database backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 