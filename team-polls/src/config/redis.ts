import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

// Create Redis client
const redisClient = createClient({
  url: `redis://${env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : ''}${env.REDIS_HOST}:${env.REDIS_PORT}`,
});

// Connect to Redis and handle errors
redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Create a separate pub/sub client for WebSocket events
const createPubSubClient = async () => {
  const pubSubClient = redisClient.duplicate();
  await pubSubClient.connect();
  logger.info('Created Redis pub/sub client');
  return pubSubClient;
};

export { redisClient, connectRedis, createPubSubClient };