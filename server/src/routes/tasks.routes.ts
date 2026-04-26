import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validate } from '../middleware/validate';
import { taskCreateSchema, taskUpdateSchema } from '../schemas/task.schema';
import {
  create,
  list,
  getById,
  update,
  remove,
  today,
  upcoming,
  stats,
} from '../controllers/tasks.controller';

const router = Router();

// Dashboard endpoints — must be declared BEFORE /:id so they are not shadowed by the param route
router.get('/today', requireAuth, today);
router.get('/upcoming', requireAuth, upcoming);
router.get('/stats', requireAuth, stats);

// Task CRUD
router.get('/', requireAuth, list);
router.post('/', requireAuth, validate(taskCreateSchema), create);
router.get('/:id', requireAuth, getById);
router.patch('/:id', requireAuth, validate(taskUpdateSchema), update);
router.delete('/:id', requireAuth, remove);

export default router;
