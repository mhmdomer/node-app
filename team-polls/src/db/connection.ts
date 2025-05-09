import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Create a connection pool to PostgreSQL
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  // Connection pool settings for improved performance
  max: 20, // Max number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Test the database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL connection error:', err);
});

// Function to query the database with error handling
export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', { 
      text, 
      duration, 
      rows: res.rowCount 
    });
    
    return res;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// Close pool on application termination
process.on('SIGINT', async () => {
  await pool.end();
  logger.info('Database connection pool closed');
});