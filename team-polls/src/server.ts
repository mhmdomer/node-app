import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import { promClient, register, httpMetricsMiddleware } from './utils/metrics';
import { logger, logStream } from './utils/logger';
import morgan from 'morgan';
import { env } from './config/env';
import { connectRedis, createPubSubClient } from './config/redis';
import { pool } from './db/connection';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware';

// Import routes
import authRoutes from './routes/authRoutes';
import pollRoutes from './routes/pollRoutes';

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('combined', { stream: logStream })); // HTTP request logging
app.use(httpMetricsMiddleware); // Track HTTP metrics

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/poll', pollRoutes);

// Error handling middleware (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Handle WebSocket connections
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Update active connections gauge
  promClient.activeWebSocketConnections.inc();
  
  // Join a poll room to receive updates
  socket.on('join-poll', (pollId) => {
    logger.debug(`Client ${socket.id} joined poll ${pollId}`);
    socket.join(`poll:${pollId}`);
  });
  
  // Leave a poll room
  socket.on('leave-poll', (pollId) => {
    logger.debug(`Client ${socket.id} left poll ${pollId}`);
    socket.leave(`poll:${pollId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    // Update active connections gauge
    promClient.activeWebSocketConnections.dec();
  });
});

// Periodically close expired polls
setInterval(async () => {
  try {
    const { PollModel } = require('./models/Poll');
    const closedCount = await PollModel.closeExpiredPolls();
    if (closedCount > 0) {
      logger.info(`Closed ${closedCount} expired polls`);
    }
  } catch (error) {
    logger.error('Error closing expired polls:', error);
  }
}, 60000); // Check every minute

// Start server
const PORT = env.PORT;

// Initialize function to connect to services and start server
async function initialize() {
  try {
    // Connect to Redis
    await connectRedis();
    
    // Create Redis pub/sub client for WebSocket events
    const pubSubClient = await createPubSubClient();
    
    // Subscribe to poll events and broadcast to WebSocket clients
    pubSubClient.subscribe('poll:*', (message, channel) => {
      try {
        const pollId = channel.split(':')[1];
        const data = JSON.parse(message);
        io.to(`poll:${pollId}`).emit('poll-update', data);
        logger.debug(`Broadcast poll update to ${pollId}`);
        
        // Increment websocket broadcast counter metric
        promClient.wsEventCounter.inc({ event_type: data.type || 'unknown' });
      } catch (error) {
        logger.error('Error broadcasting WebSocket message:', error);
      }
    });
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close Socket.IO connections
  io.close(() => {
    logger.info('WebSocket server closed');
  });
  
  try {
    // Close database connection
    await pool.end();
    logger.info('Database connection closed');
    
    // Close Redis connections
    const { redisClient } = require('./config/redis');
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Initialize server
initialize();