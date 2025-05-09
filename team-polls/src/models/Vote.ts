import { z } from 'zod';
import { query } from '../db/connection';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// Define the schema for a Vote
export const VoteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
  created_at: z.date()
});

// Type for a Vote
export type Vote = z.infer<typeof VoteSchema>;

// Type for creating a new Vote
export type VoteCreate = {
  userId: string;
  pollId: string;
  optionId: string;
};

export class VoteModel {
  /**
   * Create a new vote, ensuring idempotency per user
   */
  static async create(voteData: VoteCreate): Promise<Vote | null> {
    try {
      // Check if poll is closed
      const pollResult = await query(
        'SELECT closed, expires_at FROM polls WHERE id = $1',
        [voteData.pollId]
      );
      
      if (pollResult.rows.length === 0) {
        throw new Error('Poll not found');
      }
      
      const poll = pollResult.rows[0];
      
      // Check if poll is expired
      if (poll.closed || new Date(poll.expires_at) <= new Date()) {
        throw new Error('Poll is closed or expired');
      }
      
      // Check if option exists and belongs to this poll
      const optionResult = await query(
        'SELECT * FROM poll_options WHERE id = $1 AND poll_id = $2',
        [voteData.optionId, voteData.pollId]
      );
      
      if (optionResult.rows.length === 0) {
        throw new Error('Invalid option or option does not belong to this poll');
      }
      
      // Check if user has already voted in this poll
      const existingVote = await query(
        'SELECT id, option_id FROM votes WHERE user_id = $1 AND poll_id = $2',
        [voteData.userId, voteData.pollId]
      );
      
      // If user already voted for this option, return the existing vote
      if (existingVote.rows.length > 0) {
        if (existingVote.rows[0].option_id === voteData.optionId) {
          // Same option, just return the existing vote
          return this.findById(existingVote.rows[0].id);
        } else {
          // User is changing their vote - update the existing vote
          const updateResult = await query(
            'UPDATE votes SET option_id = $1 WHERE id = $2 RETURNING *',
            [voteData.optionId, existingVote.rows[0].id]
          );
          
          const vote = updateResult.rows[0];
          
          // Publish vote change event
          await this.publishVoteEvent(voteData.pollId, voteData.optionId, existingVote.rows[0].option_id);
          
          return {
            ...vote,
            created_at: new Date(vote.created_at)
          };
        }
      }
      
      // User hasn't voted yet, create a new vote
      const result = await query(
        'INSERT INTO votes (user_id, poll_id, option_id) VALUES ($1, $2, $3) RETURNING *',
        [voteData.userId, voteData.pollId, voteData.optionId]
      );
      
      const vote = result.rows[0];
      
      // Publish vote event
      await this.publishVoteEvent(voteData.pollId, voteData.optionId);
      
      return {
        ...vote,
        created_at: new Date(vote.created_at)
      };
    } catch (error) {
      logger.error('Error creating vote:', error);
      throw error;
    }
  }
  
  /**
   * Find a vote by ID
   */
  static async findById(id: string): Promise<Vote | null> {
    const result = await query(
      'SELECT * FROM votes WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const vote = result.rows[0];
    return {
      ...vote,
      created_at: new Date(vote.created_at)
    };
  }
  
  /**
   * Check if user has voted in a poll
   */
  static async hasUserVoted(userId: string, pollId: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM votes WHERE user_id = $1 AND poll_id = $2',
      [userId, pollId]
    );
    
    return result.rows.length > 0;
  }
  
  /**
   * Publish vote event to Redis for WebSocket broadcasting
   */
  private static async publishVoteEvent(
    pollId: string, 
    optionId: string, 
    previousOptionId?: string
  ): Promise<void> {
    const event = {
      type: 'VOTE',
      pollId,
      optionId,
      previousOptionId,
      timestamp: new Date()
    };
    
    try {
      await redisClient.publish(`poll:${pollId}`, JSON.stringify(event));
      logger.debug(`Published vote event for poll ${pollId}`);
    } catch (error) {
      logger.error(`Failed to publish vote event: ${error}`);
    }
  }
}