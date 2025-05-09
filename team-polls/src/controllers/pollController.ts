import { Request, Response } from 'express';
import { PollModel } from '../models/Poll';
import { VoteModel } from '../models/Vote';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorMiddleware';

export class PollController {
  /**
   * Create a new poll
   * POST /poll
   */
  static async createPoll(req: Request, res: Response): Promise<void> {
    try {
      const { question, options, expiresAt } = req.body;
      
      // Create poll in database
      const poll = await PollModel.create({
        question,
        options,
        expiresAt: new Date(expiresAt)
      });
      
      res.status(201).json({
        id: poll.id,
        question: poll.question,
        options: poll.options.map(option => ({
          id: option.id,
          text: option.option_text
        })),
        expiresAt: poll.expires_at
      });
    } catch (error) {
      logger.error('Error creating poll:', error);
      throw new AppError('Failed to create poll', 500);
    }
  }
  
/**
 * Cast a vote on a poll
 * POST /poll/:id/vote
 */
static async castVote(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    const pollId = req.params.id;
    const { optionId } = req.body;
    
    // Create or update vote
    await VoteModel.create({
      userId: req.user.userId,
      pollId,
      optionId
    });

    const io = req.app.get('io');
    if (io) {
      logger.info(`Publishing poll update for poll ${pollId}`);
      io.to(`poll:${pollId}`).emit('poll-update', {
        pollId,
        message: 'Vote recorded'
      });
    } else {
      logger.warn('Socket.IO instance not available');
    }
    
    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      pollId,
      optionId
    });
  
  } catch (error: any) {
      if (error.message === 'Poll not found') {
        throw new AppError('Poll not found', 404);
      } else if (error.message === 'Poll is closed or expired') {
        throw new AppError('Poll is closed or expired', 403);
      } else if (error.message === 'Invalid option or option does not belong to this poll') {
        throw new AppError('Invalid option ID', 400);
      }
      
      logger.error('Error casting vote:', error);
      throw new AppError('Failed to cast vote', 500);
    }
}
  
  /**
   * Get poll details and results
   * GET /poll/:id
   */
  static async getPollResults(req: Request, res: Response): Promise<void> {
    try {
      const pollId = req.params.id;
      
      // Get poll tally
      const pollTally = await PollModel.getTally(pollId);
      
      if (!pollTally) {
        throw new AppError('Poll not found', 404);
      }
      
      res.status(200).json({
        id: pollTally.poll_id,
        question: pollTally.question,
        expiresAt: pollTally.expires_at,
        closed: pollTally.closed,
        totalVotes: pollTally.total_votes,
        options: pollTally.options
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error retrieving poll results:', error);
      throw new AppError('Failed to retrieve poll results', 500);
    }
  }
}