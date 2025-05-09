import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';

// Define the schema for a User
export const UserSchema = z.object({
  id: z.string().uuid(),
  anonymous_id: z.string(),
  created_at: z.date()
});

// Type for a User
export type User = z.infer<typeof UserSchema>;

// Type for creating a new User
export type UserCreate = {
  anonymous_id: string;
};

export class UserModel {
  /**
   * Create a new anonymous user
   */
  static async create(): Promise<User> {
    const anonymousId = uuidv4();
    
    const result = await query(
      'INSERT INTO users (anonymous_id) VALUES ($1) RETURNING *',
      [anonymousId]
    );
    
    const user = result.rows[0];
    return {
      ...user,
      created_at: new Date(user.created_at)
    };
  }
  
  /**
   * Find a user by their anonymous ID
   */
  static async findByAnonymousId(anonymousId: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE anonymous_id = $1',
      [anonymousId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      ...user,
      created_at: new Date(user.created_at)
    };
  }
  
  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      ...user,
      created_at: new Date(user.created_at)
    };
  }
}