import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

/**
 * @route POST /auth/anon
 * @description Create anonymous user and return JWT token
 * @access Public
 */
router.post('/anon', AuthController.createAnonymousUser);

export default router;