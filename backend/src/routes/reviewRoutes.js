import { Router } from 'express';
import {
  createReview,
  uploadReview,
  getReviews,
  getReviewById,
} from '../controllers/reviewController.js';
import { handleUpload } from '../middleware/uploadMiddleware.js';
import {
  submitReview,
  createRevision,
  getRevisions,
  getRevisionByVersion,
  compareRevisions,
  approveReview,
  rejectReview,
  requestChanges,
  addComment,
  getComments,
  getAuditTrail,
} from '../controllers/workflowController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { reviewRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { createReviewSchema } from '../validators/reviewValidator.js';
import {
  createRevisionSchema,
  createCommentSchema,
  approveReviewSchema,
  rejectReviewSchema,
  requestChangesSchema,
} from '../validators/workflowValidators.js';

const router = Router();

// ==========================================
// Base Review Endpoints
// ==========================================
router
  .route('/')
  .post(protect, reviewRateLimiter, validateBody(createReviewSchema), createReview)
  .get(protect, getReviews);

// Dedicated Multimodal Document (PDF) & Image Upload Endpoint
router.post('/upload', protect, reviewRateLimiter, handleUpload, uploadReview);

router.route('/:id').get(protect, getReviewById);

// ==========================================
// Workflow Revisions
// ==========================================
router
  .route('/:id/revisions')
  .post(protect, reviewRateLimiter, validateBody(createRevisionSchema), createRevision)
  .get(protect, getRevisions);

// Multimodal Revision Upload Endpoint
router.post('/:id/revisions/upload', protect, reviewRateLimiter, handleUpload, createRevision);

// Revision Comparison Endpoints (must come before :versionNumber param)
router.get('/:id/revisions/compare', protect, compareRevisions);
router.get('/:id/revisions/compare/:v1/:v2', protect, compareRevisions);

router.route('/:id/revisions/:versionNumber').get(protect, getRevisionByVersion);

// ==========================================
// Workflow Comments & Feedback
// ==========================================
router
  .route('/:id/comments')
  .post(protect, validateBody(createCommentSchema), addComment)
  .get(protect, getComments);

// ==========================================
// Workflow Submissions & Human Decisions
// (Only Brand Manager and Admin can review and sign off)
// ==========================================
router.post('/:id/submit', protect, submitReview);

router.post(
  '/:id/approve',
  protect,
  authorize('brand_manager', 'admin'),
  validateBody(approveReviewSchema),
  approveReview
);

router.post(
  '/:id/reject',
  protect,
  authorize('brand_manager', 'admin'),
  validateBody(rejectReviewSchema),
  rejectReview
);

router.post(
  '/:id/request-changes',
  protect,
  authorize('brand_manager', 'admin'),
  validateBody(requestChangesSchema),
  requestChanges
);

// ==========================================
// Audit Trail
// ==========================================
router.get('/:id/audit-trail', protect, getAuditTrail);

export default router;
