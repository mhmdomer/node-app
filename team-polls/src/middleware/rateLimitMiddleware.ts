import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisClient } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Create a Redis-based rate limiter
const rateLimiter = new RateLimiterRedis({
  // Use storeClient with the redis client instance
  storeClient: redisClient,
  keyPrefix: 'ratelimit',
  points: env.RATE_LIMIT_POINTS, // Number of points
  duration: env.RATE_LIMIT_DURATION, // Per duration in seconds
  blockDuration: 10, // Block for 10 seconds if consumed too many points
  // Force string key type to avoid Lua type errors
  inmemoryBlockOnConsumed: env.RATE_LIMIT_POINTS,
});

/**
 * Rate limiting middleware
 * Used to rate-limit votes to 5/sec per user
 */
export const rateLimitByUserId = async (req: Request, res: Response, next: NextFunction) => {
  // Skip if no user ID (should never happen as this middleware comes after authentication)
  if (!req.user?.userId) {
    return next();
  }

  // Ensure the userId is a string to avoid Lua type errors
  const userId = String(req.user.userId);
  
  try {
    // Consume points
    await rateLimiter.consume(userId);
    next();
  } catch (error: any) {
    // Rate limit exceeded
    logger.warn(`Rate limit exceeded for user ${userId}`);
    
    const retryAfter = error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 1;
    
    // Set retry-after header and return 429 Too Many Requests
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry after ${retryAfter} seconds`,
      retryAfter
    });
  }
};
