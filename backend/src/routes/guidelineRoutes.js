import { Router } from 'express';
import {
  getGuidelineById,
  updateGuideline,
  deleteGuideline,
} from '../controllers/guidelineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { updateGuidelineSchema } from '../validators/brandValidators.js';

const router = Router();

router
  .route('/:id')
  .get(protect, getGuidelineById)
  .patch(protect, authorize('admin'), validateBody(updateGuidelineSchema), updateGuideline)
  .delete(protect, authorize('admin'), deleteGuideline);

export default router;
