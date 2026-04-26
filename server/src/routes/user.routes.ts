import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validate } from '../middleware/validate';
import { profileUpdateSchema, passwordChangeSchema } from '../schemas/user.schema';
import { getProfile, updateProfile, changePassword } from '../controllers/user.controller';

const router = Router();

// GET /api/user/profile — returns current user profile
router.get('/profile', requireAuth, getProfile);

// PATCH /api/user/profile — update name and/or email (email change requires currentPassword)
router.patch('/profile', requireAuth, validate(profileUpdateSchema), updateProfile);

// PATCH /api/user/password — change password (verifies current, sets new)
router.patch('/password', requireAuth, validate(passwordChangeSchema), changePassword);

export default router;
