# Team Polls

A real-time polling application with WebSocket support for instant updates.

## Features

- Create polls with multiple options
- Anonymous authentication with JWT
- Real-time updates of poll results via WebSockets
- PostgreSQL for data persistence
- Redis for WebSocket fan-out and rate limiting
- Prometheus metrics for monitoring
- Graceful shutdown handling

## Tech Stack

- Node.js & TypeScript
- Express.js for REST API
- Socket.IO for WebSocket communication
- PostgreSQL database
- Redis for caching and pub/sub
- Zod for validation
- Winston for logging
- Prometheus for metrics

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- Redis

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
4. Run database migrations:
   ```bash
   npm run migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /auth/anon` - Create anonymous user and get JWT token

### Polls

- `POST /poll` - Create a new poll
- `GET /poll/:id` - Get poll details and results
- `POST /poll/:id/vote` - Vote on a poll (requires authentication)

### Monitoring

- `GET /health` - Health check endpoint
- `GET /metrics` - Prometheus metrics endpoint

## WebSocket Events

### Client to Server

- `join-poll` - Join a poll room to receive updates
- `leave-poll` - Leave a poll room

### Server to Client

- `poll-update` - Real-time poll updates

## Environment Variables

See `.env.example` for all required environment variables.