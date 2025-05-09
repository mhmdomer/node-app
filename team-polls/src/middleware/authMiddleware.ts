import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        anonymousId: string;
      };
    }
  }
}

/**
 * Middleware to authenticate users via JWT token
 * Expects token in Authorization header: "Bearer <token>"
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required'
    });
  }
  
  // Extract the token
  const token = authHeader.split(' ')[1];
  
  // Verify the token
  const decoded = AuthService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
  
  // Add user data to request
  req.user = {
    userId: decoded.userId,
    anonymousId: decoded.anonymousId
  };
  
  next();
};