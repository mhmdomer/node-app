import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface TokenPayload {
  userId: string;
  anonymousId: string;
  iat: number;
  exp: number;
}

export class AuthService {
  /**
   * Create a new anonymous user and generate a JWT token
   */
  static async createAnonymousUser(): Promise<string> {
    try {
      // Create a new anonymous user
      const user = await UserModel.create();
      
      // Generate JWT token
      return this.generateToken(user.id, user.anonymous_id);
    } catch (error) {
      logger.error('Error creating anonymous user:', error);
      throw error;
    }
  }
  
  /**
   * Generate a JWT token for a user
   */
  static generateToken(userId: string, anonymousId: string): string {
    try {
      const payload = { 
        userId,
        anonymousId
      };
      
      // Use type assertion to work around TypeScript errors
      // @ts-ignore - Suppress TypeScript error for this line
      return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw error;
    }
  }
  
  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      // Use type assertion to work around TypeScript errors
      // @ts-ignore - Suppress TypeScript error for this line
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Invalid token:', error);
      return null;
    }
  }
}