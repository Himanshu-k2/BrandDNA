import { Router } from 'express';
import {
  getFactById,
  updateFact,
  deleteFact,
} from '../controllers/factController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { updateFactSchema } from '../validators/brandValidators.js';

const router = Router();

router
  .route('/:id')
  .get(protect, getFactById)
  .patch(protect, authorize('admin'), validateBody(updateFactSchema), updateFact)
  .delete(protect, authorize('admin'), deleteFact);

export default router;
