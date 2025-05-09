# Team Polls Application

A full-stack application for creating and voting on polls in real-time.

## Project Structure

The project consists of two main components:

- **team-polls** - Backend API server built with Node.js, Express, TypeScript, PostgreSQL, and Redis
- **team-polls-frontend** - Frontend application built with React, TypeScript, and Socket.IO client

## Features

- Create polls with multiple options
- Vote on polls in real-time
- Anonymous user authentication
- Real-time updates via WebSockets
- Responsive UI for all devices
- Share polls via shareable links
- Metrics collection with Prometheus
- Containerized deployment with Docker

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (for local development)
- Redis (for local development)

## Getting Started

### Using Docker (Recommended)

The easiest way to run the entire application stack is using Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd team-polls-app

# Start all services with Docker Compose
docker-compose up -d

# Access the application at http://localhost
```

This will start the following services:

- Frontend: http://localhost
- Backend API: http://localhost:3000
- Prometheus: http://localhost:9090
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Local Development

#### Backend

```bash
# Navigate to backend directory
cd team-polls

# Install dependencies
npm install

# Setup the database
npm run migrate

# Start the development server
npm run dev
```

The backend API server will be available at http://localhost:3000

#### Frontend

```bash
# Navigate to frontend directory
cd team-polls-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend development server will be available at http://localhost:3001

## API Documentation

See the [API documentation](./team-polls/API.md) for details on the available endpoints.

## Architecture

The application follows a microservices architecture pattern:

1. **Frontend** - React SPA with real-time updates via Socket.IO
2. **Backend API** - Express-based REST API with WebSocket support
3. **Database** - PostgreSQL for persistent storage
4. **Cache & Pub/Sub** - Redis for caching and WebSocket fan-out
5. **Metrics** - Prometheus for metrics collection and monitoring

## Environment Variables

### Backend Environment Variables

See the [.env file](./team-polls/.env) for the full list of configuration options.

### Frontend Environment Variables

The frontend uses proxying to communicate with the backend API and doesn't require specific environment variables.

## License

ISC