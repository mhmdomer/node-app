import request from 'supertest';
import express from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';

// Mock the AuthService
jest.mock('../services/authService');
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Auth API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/auth/anon', AuthController.createAnonymousUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/anon', () => {
    it('should create an anonymous user and return a JWT token', async () => {
      // Mock token generation
      const mockToken = 'mock.jwt.token';
      (AuthService.createAnonymousUser as jest.Mock).mockResolvedValue(mockToken);
      
      const response = await request(app)
        .post('/auth/anon')
        .expect(201);
      
      expect(response.body).toHaveProperty('token', mockToken);
      expect(response.body).toHaveProperty('expiresIn');
      expect(AuthService.createAnonymousUser).toHaveBeenCalled();
    });

    it('should return 500 when token creation fails', async () => {
      // Mock service error
      (AuthService.createAnonymousUser as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .post('/auth/anon')
        .expect(500);
      
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'Failed to create anonymous user');
    });
  });
});