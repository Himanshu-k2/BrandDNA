import ApprovedFact from '../models/ApprovedFact.js';
import Brand from '../models/Brand.js';

/**
 * @route   POST /api/brands/:id/facts
 * @desc    Create an approved brand fact
 * @access  Private (Admin only)
 */
export const createFact = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const {
      key,
      value,
      description,
      category,
      sourceReference,
      verificationStatus,
      validFrom,
      validUntil,
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
        message: 'Forbidden: You cannot add facts to another organization brand',
      });
    }

    const fact = new ApprovedFact({
      brandId,
      organizationId,
      key: key.toLowerCase().trim(),
      value: value.trim(),
      description,
      category: category || 'general',
      sourceReference,
      verificationStatus: verificationStatus || 'verified',
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      version: 1,
      history: [],
      createdBy: req.user._id,
    });

    await fact.save();

    res.status(201).json({
      success: true,
      message: 'Approved fact created successfully',
      data: fact.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/brands/:id/facts
 * @desc    List approved facts for a brand
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getFactsByBrand = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const { category, verificationStatus, status, page = 1, limit = 50 } = req.query;
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
        message: 'Forbidden: You cannot view facts from another organization',
      });
    }

    const query = { brandId, organizationId };
    if (category) query.category = category;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (status) query.status = status;
    else query.status = 'active';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [facts, total] = await Promise.all([
      ApprovedFact.find(query)
        .sort({ key: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email'),
      ApprovedFact.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: facts.map((f) => f.toJSON()),
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
 * @route   GET /api/facts/:id
 * @desc    Get single approved fact by ID
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getFactById = async (req, res, next) => {
  try {
    const fact = await ApprovedFact.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!fact) {
      return res.status(404).json({
        success: false,
        message: 'Fact not found',
      });
    }

    if (fact.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access facts from another organization',
      });
    }

    res.status(200).json({
      success: true,
      data: fact.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/facts/:id
 * @desc    Update approved fact with versioning
 * @access  Private (Admin only)
 */
export const updateFact = async (req, res, next) => {
  try {
    const fact = await ApprovedFact.findById(req.params.id);

    if (!fact) {
      return res.status(404).json({
        success: false,
        message: 'Fact not found',
      });
    }

    if (fact.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update facts from another organization',
      });
    }

    const {
      key,
      value,
      description,
      category,
      sourceReference,
      verificationStatus,
      validFrom,
      validUntil,
      status,
    } = req.body;

    const dataChanged =
      (key && key.toLowerCase().trim() !== fact.key) ||
      (value && value.trim() !== fact.value) ||
      (sourceReference !== undefined && sourceReference !== fact.sourceReference);

    if (dataChanged) {
      // Archive current version into history
      fact.history.push({
        version: fact.version,
        key: fact.key,
        value: fact.value,
        sourceReference: fact.sourceReference,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      });

      fact.version += 1;
      if (key) fact.key = key.toLowerCase().trim();
      if (value) fact.value = value.trim();
      if (sourceReference !== undefined) fact.sourceReference = sourceReference;
      fact.updatedBy = req.user._id;
    }

    if (description !== undefined) fact.description = description;
    if (category) fact.category = category;
    if (verificationStatus) fact.verificationStatus = verificationStatus;
    if (validFrom !== undefined) fact.validFrom = validFrom ? new Date(validFrom) : null;
    if (validUntil !== undefined) fact.validUntil = validUntil ? new Date(validUntil) : null;
    if (status) fact.status = status;

    await fact.save();

    res.status(200).json({
      success: true,
      message: 'Fact updated successfully',
      data: fact.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/facts/:id
 * @desc    Archive approved fact
 * @access  Private (Admin only)
 */
export const deleteFact = async (req, res, next) => {
  try {
    const fact = await ApprovedFact.findById(req.params.id);

    if (!fact) {
      return res.status(404).json({
        success: false,
        message: 'Fact not found',
      });
    }

    if (fact.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot archive facts from another organization',
      });
    }

    fact.status = 'archived';
    await fact.save();

    res.status(200).json({
      success: true,
      message: 'Fact archived successfully',
      data: fact.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
