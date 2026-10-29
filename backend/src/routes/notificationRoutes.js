import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markNotificationRead);
router.post('/read-all', protect, markAllNotificationsRead);

export default router;
