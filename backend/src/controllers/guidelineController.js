import BrandGuideline from '../models/BrandGuideline.js';
import Brand from '../models/Brand.js';

/**
 * @route   POST /api/brands/:id/guidelines
 * @desc    Create a new brand guideline
 * @access  Private (Admin only)
 */
export const createGuideline = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const { title, category, ruleText, severity } = req.body;
    const organizationId = req.user.organizationId;

    // Verify brand exists and user's organization owns it
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    if (brand.organizationId.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot add guidelines to another organization brand',
      });
    }

    const guideline = new BrandGuideline({
      brandId,
      organizationId,
      title,
      category,
      ruleText,
      severity: severity || 'medium',
      version: 1,
      history: [],
      createdBy: req.user._id,
    });

    await guideline.save();

    res.status(201).json({
      success: true,
      message: 'Brand guideline created successfully',
      data: guideline.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/brands/:id/guidelines
 * @desc    List all guidelines for a brand
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getGuidelinesByBrand = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const { category, status, page = 1, limit = 50 } = req.query;
    const organizationId = req.user.organizationId;

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    if (brand.organizationId.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view guidelines from another organization',
      });
    }

    const query = { brandId, organizationId };
    if (category) query.category = category;
    if (status) query.status = status;
    else query.status = 'active';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [guidelines, total] = await Promise.all([
      BrandGuideline.find(query)
        .sort({ category: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email'),
      BrandGuideline.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: guidelines.map((g) => g.toJSON()),
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
 * @route   GET /api/guidelines/:id
 * @desc    Get single guideline by ID
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getGuidelineById = async (req, res, next) => {
  try {
    const guideline = await BrandGuideline.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!guideline) {
      return res.status(404).json({
        success: false,
        message: 'Guideline not found',
      });
    }

    if (guideline.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access guidelines from another organization',
      });
    }

    res.status(200).json({
      success: true,
      data: guideline.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/guidelines/:id
 * @desc    Update guideline with automatic version increment and history preservation
 * @access  Private (Admin only)
 */
export const updateGuideline = async (req, res, next) => {
  try {
    const guideline = await BrandGuideline.findById(req.params.id);

    if (!guideline) {
      return res.status(404).json({
        success: false,
        message: 'Guideline not found',
      });
    }

    if (guideline.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update guidelines from another organization',
      });
    }

    const { title, category, ruleText, severity, status } = req.body;

    // Check if content changed (warrants a version increment)
    const contentChanged =
      (title && title !== guideline.title) ||
      (category && category !== guideline.category) ||
      (ruleText && ruleText !== guideline.ruleText) ||
      (severity && severity !== guideline.severity);

    if (contentChanged) {
      // Archive current version into history
      guideline.history.push({
        version: guideline.version,
        title: guideline.title,
        category: guideline.category,
        ruleText: guideline.ruleText,
        severity: guideline.severity,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      });

      guideline.version += 1;
      if (title) guideline.title = title;
      if (category) guideline.category = category;
      if (ruleText) guideline.ruleText = ruleText;
      if (severity) guideline.severity = severity;
      guideline.updatedBy = req.user._id;
    }

    if (status) {
      guideline.status = status;
    }

    await guideline.save();

    res.status(200).json({
      success: true,
      message: 'Guideline updated successfully',
      data: guideline.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/guidelines/:id
 * @desc    Archive a guideline
 * @access  Private (Admin only)
 */
export const deleteGuideline = async (req, res, next) => {
  try {
    const guideline = await BrandGuideline.findById(req.params.id);

    if (!guideline) {
      return res.status(404).json({
        success: false,
        message: 'Guideline not found',
      });
    }

    if (guideline.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot archive guidelines from another organization',
      });
    }

    guideline.status = 'archived';
    await guideline.save();

    res.status(200).json({
      success: true,
      message: 'Guideline archived successfully',
      data: guideline.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
