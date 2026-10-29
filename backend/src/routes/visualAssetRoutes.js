import { Router } from 'express';
import { deleteVisualAsset } from '../controllers/visualAssetController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.route('/:id').delete(protect, authorize('admin'), deleteVisualAsset);

export default router;
