import { z } from 'zod';
import { query } from '../db/connection';

// Define the schema for poll options
export const PollOptionSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  option_text: z.string(),
  created_at: z.date()
});

export type PollOption = z.infer<typeof PollOptionSchema>;

// Define the schema for a Poll
export const PollSchema = z.object({
  id: z.string().uuid(),
  question: z.string(),
  expires_at: z.date(),
  created_at: z.date(),
  closed: z.boolean()
});

// Type for a Poll with options
export type Poll = z.infer<typeof PollSchema> & {
  options: PollOption[];
};

// Type for creating a new Poll
export type PollCreate = {
  question: string;
  options: string[];
  expiresAt: Date;
};

// Type for poll results (tally)
export type PollTally = {
  poll_id: string;
  question: string;
  expires_at: Date;
  closed: boolean;
  total_votes: number;
  options: {
    id: string;
    option_text: string;
    vote_count: number;
    percentage: number;
  }[];
};

export class PollModel {
  /**
   * Create a new poll with options
   */
  static async create(pollData: PollCreate): Promise<Poll> {
    // Start a transaction
    const client = await query('BEGIN');
    
    try {
      // Insert poll
      const pollResult = await query(
        'INSERT INTO polls (question, expires_at) VALUES ($1, $2) RETURNING *',
        [pollData.question, pollData.expiresAt]
      );
      
      const poll = pollResult.rows[0];
      const pollId = poll.id;
      const options: PollOption[] = [];
      
      // Insert options
      for (const optionText of pollData.options) {
        const optionResult = await query(
          'INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2) RETURNING *',
          [pollId, optionText]
        );
        
        const option = optionResult.rows[0];
        options.push({
          ...option,
          created_at: new Date(option.created_at)
        });
      }
      
      // Commit the transaction
      await query('COMMIT');
      
      return {
        ...poll,
        expires_at: new Date(poll.expires_at),
        created_at: new Date(poll.created_at),
        options
      };
    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Find a poll by ID with its options
   */
  static async findById(id: string): Promise<Poll | null> {
    // Get poll data
    const pollResult = await query(
      'SELECT * FROM polls WHERE id = $1',
      [id]
    );
    
    if (pollResult.rows.length === 0) {
      return null;
    }
    
    const poll = pollResult.rows[0];
    
    // Get options for this poll
    const optionsResult = await query(
      'SELECT * FROM poll_options WHERE poll_id = $1 ORDER BY created_at',
      [id]
    );
    
    const options = optionsResult.rows.map((option: any) => ({
      ...option,
      created_at: new Date(option.created_at)
    }));
    
    return {
      ...poll,
      expires_at: new Date(poll.expires_at),
      created_at: new Date(poll.created_at),
      options
    };
  }
  
  /**
   * Get poll tally (results)
   */
  static async getTally(pollId: string): Promise<PollTally | null> {
    // Check poll exists and get poll data
    const pollResult = await query(`
      SELECT p.id, p.question, p.expires_at, p.closed FROM polls p WHERE p.id = $1
    `, [pollId]);
    
    if (pollResult.rows.length === 0) {
      return null;
    }
    
    const poll = pollResult.rows[0];
    
    // Get total votes for this poll
    const totalVotesResult = await query(`
      SELECT COUNT(*) as total FROM votes WHERE poll_id = $1
    `, [pollId]);
      // Ensure totalVotes is always a number, never null
      const totalVotes: number = parseInt(totalVotesResult.rows[0].total) || 0;
    
      // Get options with vote counts
      const optionsResult = await query(`
        SELECT 
          po.id, 
          po.option_text, 
          COUNT(v.id) as vote_count 
        FROM 
          poll_options po 
        LEFT JOIN 
          votes v ON po.id = v.option_id 
        WHERE 
          po.poll_id = $1 
        GROUP BY 
          po.id, 
          po.option_text 
        ORDER BY 
          vote_count DESC, 
          po.created_at ASC
      `, [pollId]);
      
      // Calculate percentages
      const options = optionsResult.rows.map((option: any) => {
        // Ensure voteCount is always a number, never null
        const voteCount: number = parseInt(option.vote_count) || 0;
        const percentage = totalVotes > 0 
          ? Math.round((voteCount / totalVotes) * 100) 
          : 0;
        
        return {
          id: option.id,
          option_text: option.option_text,
          vote_count: voteCount,
          percentage
        };
      });
      
      return {
        poll_id: pollId,
        question: poll.question,
        expires_at: new Date(poll.expires_at),
        closed: poll.closed,
        total_votes: totalVotes,
        options
      };
    }
}