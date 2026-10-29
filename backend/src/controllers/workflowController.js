import {
  submitReviewForApproval,
  createReviewRevision,
  approveContentReview,
  rejectContentReview,
  requestReviewChanges,
  addReviewComment,
} from '../services/workflowService.js';
import ReviewRevision from '../models/ReviewRevision.js';
import ReviewComment from '../models/ReviewComment.js';
import AuditLog from '../models/AuditLog.js';
import ContentReview from '../models/ContentReview.js';

/**
 * @route   POST /api/reviews/:id/submit
 * @desc    Submit content from draft/needs_changes for human approval
 * @access  Private (Creator, Admin)
 */
export const submitReview = async (req, res, next) => {
  try {
    const review = await submitReviewForApproval(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Content successfully submitted for human approval',
      data: review.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/:id/revisions
 * @desc    Submit a new revision of the content (increments version, re-runs review)
 * @access  Private (Creator, Admin)
 */
export const createRevision = async (req, res, next) => {
  try {
    const { content, submissionNote } = req.body;
    const file = req.file || null;
    const { review, revision } = await createReviewRevision(
      req.params.id,
      { content, file, submissionNote },
      req.user
    );

    res.status(201).json({
      success: true,
      message: `Revision v${revision.versionNumber} created and analyzed successfully`,
      data: {
        review: review.toJSON(),
        revision: revision.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:id/revisions
 * @desc    List all revision snapshots for a review
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getRevisions = async (req, res, next) => {
  try {
    const review = await ContentReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view revisions from another organization',
      });
    }

    const revisions = await ReviewRevision.find({ reviewId: review._id })
      .sort({ versionNumber: -1 })
      .populate('submittedBy', 'name email role');

    res.status(200).json({
      success: true,
      data: revisions.map((r) => r.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:id/revisions/:versionNumber
 * @desc    Get a specific immutable revision snapshot
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getRevisionByVersion = async (req, res, next) => {
  try {
    const review = await ContentReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access revisions from another organization',
      });
    }

    const versionNumber = parseInt(req.params.versionNumber, 10);
    const revision = await ReviewRevision.findOne({
      reviewId: review._id,
      versionNumber,
    }).populate('submittedBy', 'name email role');

    if (!revision) {
      return res.status(404).json({
        success: false,
        message: `Revision version ${versionNumber} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: revision.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/:id/approve
 * @desc    Reviewer/Admin decision to officially approve content
 * @access  Private (Reviewer, Admin)
 */
export const approveReview = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const review = await approveContentReview(req.params.id, req.user, { comment });

    res.status(200).json({
      success: true,
      message: `Content Version ${review.currentVersion} officially approved`,
      data: review.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/:id/reject
 * @desc    Reviewer/Admin decision to reject content with reason
 * @access  Private (Reviewer, Admin)
 */
export const rejectReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await rejectContentReview(req.params.id, req.user, { reason });

    res.status(200).json({
      success: true,
      message: `Content Version ${review.currentVersion} rejected`,
      data: review.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/:id/request-changes
 * @desc    Reviewer/Admin requests revisions with reason
 * @access  Private (Reviewer, Admin)
 */
export const requestChanges = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await requestReviewChanges(req.params.id, req.user, { reason });

    res.status(200).json({
      success: true,
      message: `Changes requested on Content Version ${review.currentVersion}`,
      data: review.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/:id/comments
 * @desc    Add feedback or comments to a review
 * @access  Private (Admin, Creator, Reviewer)
 */
export const addComment = async (req, res, next) => {
  try {
    const { body, commentType, versionNumber } = req.body;
    const comment = await addReviewComment(req.params.id, req.user, {
      body,
      commentType,
      versionNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:id/comments
 * @desc    List all comments on a review
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getComments = async (req, res, next) => {
  try {
    const review = await ContentReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view comments from another organization',
      });
    }

    const comments = await ReviewComment.find({ reviewId: review._id })
      .sort({ createdAt: 1 })
      .populate('authorId', 'name email role');

    res.status(200).json({
      success: true,
      data: comments.map((c) => c.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:id/audit-trail
 * @desc    View immutable chronological governance audit trail
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getAuditTrail = async (req, res, next) => {
  try {
    const review = await ContentReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view audit trails from another organization',
      });
    }

    const logs = await AuditLog.find({ reviewId: review._id })
      .sort({ createdAt: -1 })
      .populate('actorId', 'name email role');

    res.status(200).json({
      success: true,
      data: logs.map((l) => l.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};
