import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validate } from '../middleware/validate';
import { subjectCreateSchema } from '../schemas/subject.schema';
import { list, create } from '../controllers/subjects.controller';

const router = Router();

router.get('/', requireAuth, list);
router.post('/', requireAuth, validate(subjectCreateSchema), create);

export default router;
