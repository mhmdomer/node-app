import { Router } from 'express';
import { z } from 'zod';
import { PollController } from '../controllers/pollController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimitByUserId } from '../middleware/rateLimitMiddleware';
import { validateRequest } from '../utils/validate';

const router = Router();

// Define validation schemas
const createPollSchema = z.object({
  body: z.object({
    question: z.string().min(5).max(200),
    options: z.array(z.string().min(1).max(100)).min(2).max(10),
    expiresAt: z.string().datetime()
  })
});

const voteSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    optionId: z.string().uuid()
  })
});

const getPollSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

/**
 * @route POST /poll
 * @description Create a new poll
 * @access Public
 */
router.post('/', validateRequest(createPollSchema), PollController.createPoll);

/**
 * @route POST /poll/:id/vote
 * @description Cast a vote on a poll
 * @access Private (requires authentication)
 * @ratelimit 5 requests per second per user
 */
router.post('/:id/vote', 
  authenticate, 
  rateLimitByUserId, 
  validateRequest(voteSchema), 
  PollController.castVote
);

/**
 * @route GET /poll/:id
 * @description Get poll details and results
 * @access Public
 */
router.get('/:id', validateRequest(getPollSchema), PollController.getPollResults);

export default router;