# Sidebar Server

This is the backend server for the Sidebar application, providing API endpoints for managing system architecture designs, chat sessions, and React Flow components.

## Prerequisites

1. **PostgreSQL** - Make sure PostgreSQL is installed and running on your machine
2. **Node.js** - Version 16 or higher

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up PostgreSQL Database
```bash
npm run setup-db
```

This script will:
- Connect to your local PostgreSQL server
- Create a `sidebar_db` database if it doesn't exist
- Create all necessary tables and indexes

### 3. Configure Environment Variables
Create a `.env` file in the server directory with your database credentials:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sidebar_db
DB_PASSWORD=postgres
DB_PORT=5432

# Server Configuration
PORT=3001
```

### 4. Start the Server
```bash
npm start
```

The server will start on port 3001 (or the port specified in your .env file).

## API Endpoints

### Projects
- `POST /api/db/projects` - Create a new project
- `GET /api/db/projects` - Get all projects

### Components
- `POST /api/db/components` - Create a new component
- `GET /api/db/components/:projectId` - Get components for a project
- `PUT /api/db/components/:id` - Update a component
- `DELETE /api/db/components/:id` - Delete a component

### Connections
- `POST /api/db/connections` - Create a new connection
- `GET /api/db/connections/:projectId` - Get connections for a project

### Chat
- `POST /api/db/chat-sessions` - Create a new chat session
- `POST /api/db/chat-messages` - Add a message to a chat session
- `GET /api/db/chat-messages/:sessionId` - Get messages for a chat session

### Scratch Notes
- `POST /api/db/scratch-notes` - Create a new scratch note
- `GET /api/db/scratch-notes/:projectId` - Get scratch notes for a project
- `PUT /api/db/scratch-notes/:id` - Update a scratch note

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `projects` - System architecture projects
- `components` - React Flow components
- `connections` - Relationships between components
- `chat_sessions` - Chat conversation sessions
- `chat_messages` - Individual chat messages
- `scratch_notes` - Project notes and scratch pad content

## Troubleshooting

### PostgreSQL Connection Issues
1. Make sure PostgreSQL is running: `brew services start postgresql` (macOS)
2. Verify your credentials in the `.env` file
3. Check that the database exists: `psql -U postgres -l`

### Port Already in Use
If port 3001 is already in use, change the PORT in your `.env` file or kill the process using that port.

## Development

The server is built with:
- Express.js for the web framework
- PostgreSQL for the database
- TypeScript for type safety
- CORS enabled for frontend integration 