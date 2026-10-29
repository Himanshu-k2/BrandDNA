import { Router } from 'express';
import {
  getTerminologyById,
  updateTerminology,
  deleteTerminology,
} from '../controllers/terminologyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { updateTerminologySchema } from '../validators/brandValidators.js';

const router = Router();

router
  .route('/:id')
  .get(protect, getTerminologyById)
  .patch(protect, authorize('admin'), validateBody(updateTerminologySchema), updateTerminology)
  .delete(protect, authorize('admin'), deleteTerminology);

export default router;
