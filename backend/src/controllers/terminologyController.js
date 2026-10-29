import TerminologyRule from '../models/TerminologyRule.js';
import Brand from '../models/Brand.js';

/**
 * @route   POST /api/brands/:id/terminology
 * @desc    Add a terminology rule to a brand
 * @access  Private (Admin only)
 */
export const createTerminology = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const {
      preferredTerm,
      prohibitedTerm,
      replacementSuggestion,
      explanation,
      caseSensitive,
    } = req.body;
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
        message: 'Forbidden: You cannot add terminology rules to another organization brand',
      });
    }

    // Check for duplicate active rule for the prohibited term
    const duplicate = await TerminologyRule.findOne({
      brandId,
      status: 'active',
      prohibitedTerm: { $regex: new RegExp(`^${prohibitedTerm.trim()}$`, 'i') },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `A terminology rule for prohibited term '${prohibitedTerm}' already exists`,
      });
    }

    const rule = new TerminologyRule({
      brandId,
      organizationId,
      preferredTerm: preferredTerm.trim(),
      prohibitedTerm: prohibitedTerm.trim(),
      replacementSuggestion: (replacementSuggestion || preferredTerm).trim(),
      explanation: explanation || '',
      caseSensitive: !!caseSensitive,
      createdBy: req.user._id,
    });

    await rule.save();

    res.status(201).json({
      success: true,
      message: 'Terminology rule created successfully',
      data: rule.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/brands/:id/terminology
 * @desc    Get all terminology rules for a brand
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getTerminologyByBrand = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const { status, page = 1, limit = 50 } = req.query;
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
        message: 'Forbidden: You cannot view terminology from another organization',
      });
    }

    const query = { brandId, organizationId };
    if (status) query.status = status;
    else query.status = 'active';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [rules, total] = await Promise.all([
      TerminologyRule.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email'),
      TerminologyRule.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: rules.map((r) => r.toJSON()),
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
 * @route   GET /api/terminology/:id
 * @desc    Get single terminology rule by ID
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getTerminologyById = async (req, res, next) => {
  try {
    const rule = await TerminologyRule.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Terminology rule not found',
      });
    }

    if (rule.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access terminology from another organization',
      });
    }

    res.status(200).json({
      success: true,
      data: rule.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/terminology/:id
 * @desc    Update a terminology rule
 * @access  Private (Admin only)
 */
export const updateTerminology = async (req, res, next) => {
  try {
    const rule = await TerminologyRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Terminology rule not found',
      });
    }

    if (rule.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update terminology from another organization',
      });
    }

    const {
      preferredTerm,
      prohibitedTerm,
      replacementSuggestion,
      explanation,
      caseSensitive,
      status,
    } = req.body;

    if (preferredTerm) rule.preferredTerm = preferredTerm.trim();
    if (prohibitedTerm) rule.prohibitedTerm = prohibitedTerm.trim();
    if (replacementSuggestion !== undefined)
      rule.replacementSuggestion = replacementSuggestion.trim();
    if (explanation !== undefined) rule.explanation = explanation;
    if (caseSensitive !== undefined) rule.caseSensitive = caseSensitive;
    if (status) rule.status = status;
    rule.updatedBy = req.user._id;

    await rule.save();

    res.status(200).json({
      success: true,
      message: 'Terminology rule updated successfully',
      data: rule.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/terminology/:id
 * @desc    Archive a terminology rule
 * @access  Private (Admin only)
 */
export const deleteTerminology = async (req, res, next) => {
  try {
    const rule = await TerminologyRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Terminology rule not found',
      });
    }

    if (rule.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot archive terminology from another organization',
      });
    }

    rule.status = 'archived';
    await rule.save();

    res.status(200).json({
      success: true,
      message: 'Terminology rule archived successfully',
      data: rule.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
