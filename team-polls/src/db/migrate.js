const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'team_polls',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

const pool = new Pool(config);

async function migrate() {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    console.log('Creating schema...');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        anonymous_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    // Polls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        closed BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
    
    // Poll options table
    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE (poll_id, option_text)
      );
    `);
    
    // Votes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, poll_id)
      );
    `);
    
    // Create index on poll_id in votes for faster tally queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
    `);
    
    // Create index on user_id in votes for faster vote checking
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (e) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch(console.error);