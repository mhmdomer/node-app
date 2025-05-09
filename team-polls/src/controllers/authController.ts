import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

export class AuthController {
  /**
   * Create anonymous user and return JWT token
   * POST /auth/anon
   */
  static async createAnonymousUser(req: Request, res: Response): Promise<void> {
    try {
      const token = await AuthService.createAnonymousUser();
      
      res.status(201).json({ 
        token,
        expiresIn: process.env.JWT_EXPIRY || '1h'
      });
    } catch (error) {
      logger.error('Error creating anonymous user:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create anonymous user'
      });
    }
  }
}