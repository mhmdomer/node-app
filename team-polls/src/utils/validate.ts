import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from './logger';

/**
 * Middleware for validating requests using Zod schemas
 * @param schema Zod schema to validate against
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      // If validation passes, proceed to the handler
      return next();
    } catch (error) {
      // If validation fails, return 400 with validation errors
      if (error instanceof ZodError) {
        logger.debug('Validation error:', error.errors);
        return res.status(400).json({
          error: 'Validation Error',
          details: error.format()
        });
      }
      
      // For any other error, pass to next error handler
      return next(error);
    }
  };
};

/**
 * Helper function to validate data against a schema outside of middleware
 * Returns [data, null] on success or [null, error] on failure
 */
export const validate = async <T>(schema: AnyZodObject, data: any): Promise<[T, null] | [null, ZodError]> => {
  try {
    const validData = await schema.parseAsync(data) as T;
    return [validData, null];
  } catch (error) {
    if (error instanceof ZodError) {
      return [null, error];
    }
    throw error;
  }
};