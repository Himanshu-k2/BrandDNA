import { executeContentReview } from '../services/reviewService.js';
import ContentReview from '../models/ContentReview.js';

/**
 * @route   POST /api/reviews
 * @desc    Submit content for automated deterministic and AI brand compliance review
 * @access  Private (Admin, Creator, Reviewer)
 */
export const createReview = async (req, res, next) => {
  try {
    const { brandId, content, contentType, title, submissionNote } = req.body;
    const organizationId = req.user.organizationId;
    const userId = req.user._id;

    const reviewResult = await executeContentReview({
      brandId,
      content,
      contentType,
      file: req.file || null,
      userId,
      organizationId,
      submissionNote,
    });

    res.status(201).json({
      success: true,
      message: reviewResult.isPartialAnalysis
        ? 'Content review completed with partial deterministic checks'
        : 'Content review analysis completed successfully',
      data: reviewResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews/upload
 * @desc    Submit a document (PDF) or image (JPEG/PNG/WebP) for multimodal compliance review
 * @access  Private (Admin, Creator, Reviewer)
 */
export const uploadReview = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF document or an image file.',
      });
    }

    const { brandId, contentType, title, submissionNote } = req.body;
    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: 'brandId is required',
      });
    }

    const organizationId = req.user.organizationId;
    const userId = req.user._id;

    const reviewResult = await executeContentReview({
      brandId,
      content: title || '',
      contentType: contentType || (req.file.mimetype.includes('pdf') ? 'document' : 'image'),
      file: req.file,
      userId,
      organizationId,
      submissionNote,
    });

    res.status(201).json({
      success: true,
      message: reviewResult.isPartialAnalysis
        ? 'Multimodal review completed with partial deterministic checks'
        : 'Multimodal review completed successfully',
      data: reviewResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews
 * @desc    List submitted reviews for the authenticated user's organization
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getReviews = async (req, res, next) => {
  try {
    const { brandId, status, page = 1, limit = 20 } = req.query;
    const organizationId = req.user.organizationId;

    const query = { organizationId };
    if (brandId) query.brandId = brandId;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      ContentReview.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('brandId', 'name')
        .populate('submittedBy', 'name email'),
      ContentReview.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: reviews.map((r) => r.toJSON()),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:id
 * @desc    Get detailed review by ID
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getReviewById = async (req, res, next) => {
  try {
    const review = await ContentReview.findById(req.params.id)
      .populate('brandId', 'name description tone')
      .populate('submittedBy', 'name email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access reviews from another organization',
      });
    }

    res.status(200).json({
      success: true,
      data: review.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
