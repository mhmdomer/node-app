import request from 'supertest';
import express from 'express';
import { PollController } from '../controllers/pollController';
import { PollModel } from '../models/Poll';

// Mock the PollModel
jest.mock('../models/Poll');
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Poll API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/poll', PollController.createPoll);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /poll', () => {
    const validPoll = {
      question: 'What is your favorite color?',
      options: ['Red', 'Blue', 'Green', 'Yellow'],
      expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
    };

    it('should create a new poll', async () => {
      // Mock the create method to return a valid poll
      (PollModel.create as jest.Mock).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: validPoll.question,
        options: validPoll.options.map((text, index) => ({
          id: `option-${index}`,
          poll_id: '123e4567-e89b-12d3-a456-426614174000',
          option_text: text,
          created_at: new Date()
        })),
        expires_at: new Date(validPoll.expiresAt),
        created_at: new Date(),
        closed: false
      });

      const response = await request(app)
        .post('/poll')
        .send(validPoll)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('question', validPoll.question);
      expect(response.body).toHaveProperty('options');
      expect(response.body.options.length).toBe(validPoll.options.length);
      expect(PollModel.create).toHaveBeenCalledWith({
        question: validPoll.question,
        options: validPoll.options,
        expiresAt: expect.any(Date)
      });
    });

    it('should return 400 for invalid request data', async () => {
      const invalidPoll = {
        question: 'Too short',
        options: ['Only one option'], // Less than minimum required options
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };

      const response = await request(app)
        .post('/poll')
        .send(invalidPoll)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(PollModel.create).not.toHaveBeenCalled();
    });
  });
});