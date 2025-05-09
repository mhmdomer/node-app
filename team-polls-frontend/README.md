# Team Polls Frontend

This is the React-based frontend for the Team Polls application, providing a user interface for creating polls and voting in real-time.

## Features

- Anonymous authentication with JWT
- Create polls with multiple options
- Vote on polls with real-time updates
- Share polls via links
- Responsive design for desktop and mobile

## Tech Stack

- React 18 with TypeScript
- Socket.IO client for WebSocket communication
- Axios for REST API communication
- Vite for fast builds and development
- NGINX for production serving

## Getting Started

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Environment Variables

When running locally, the frontend will connect to the backend at `http://localhost:3000`. In production, it uses the API proxy in the NGINX configuration to route API calls to the backend service.

## API Proxying

The application is configured to proxy API requests as follows:

- REST API requests to `/api/*` are proxied to the backend
- WebSocket connections to `/socket.io/*` are proxied to the backend

## Docker

The application includes a Dockerfile for containerization. To build and run:

```bash
# Build the Docker image
docker build -t team-polls-frontend .

# Run the container
docker run -p 80:80 team-polls-frontend
```

For full deployment including backend services, use the root docker-compose.yml file.

## License

ISC
