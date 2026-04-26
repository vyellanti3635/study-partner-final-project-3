import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { signupSchema, loginSchema } from '../schemas/auth.schema';
import { signup, login, logout, me } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), signup);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.get('/me', me);

export default router;
