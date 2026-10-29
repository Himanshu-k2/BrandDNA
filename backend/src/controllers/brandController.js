import Brand from '../models/Brand.js';

/**
 * @route   POST /api/brands
 * @desc    Create a new brand workspace
 * @access  Private (Admin only)
 */
export const createBrand = async (req, res, next) => {
  try {
    const { name, description, tone } = req.body;
    const organizationId = req.user.organizationId;

    // Check for duplicate brand name within the same organization
    const existing = await Brand.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A brand named '${name}' already exists in your workspace`,
      });
    }

    const brand = new Brand({
      name,
      description,
      tone,
      organizationId,
      createdBy: req.user._id,
    });

    await brand.save();

    res.status(201).json({
      success: true,
      message: 'Brand workspace created successfully',
      data: brand.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/brands
 * @desc    List all brands in user's organization with pagination & filtering
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getBrands = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const organizationId = req.user.organizationId;

    const query = { organizationId };

    if (status) {
      query.status = status;
    } else {
      // By default show active brands
      query.status = 'active';
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [brands, total] = await Promise.all([
      Brand.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email'),
      Brand.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: brands.map((b) => b.toJSON()),
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
 * @route   GET /api/brands/:id
 * @desc    Get single brand by ID
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id).populate('createdBy', 'name email');

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    // Verify organization ownership
    if (brand.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access brands from another organization',
      });
    }

    res.status(200).json({
      success: true,
      data: brand.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/brands/:id
 * @desc    Update brand details
 * @access  Private (Admin only)
 */
export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    if (brand.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify brands from another organization',
      });
    }

    const { name, description, tone, status } = req.body;

    if (name && name.trim() !== brand.name) {
      // Check for duplicate name
      const duplicate = await Brand.findOne({
        _id: { $ne: brand._id },
        organizationId: brand.organizationId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another brand named '${name}' already exists in your workspace`,
        });
      }
      brand.name = name.trim();
    }

    if (description !== undefined) brand.description = description;
    if (tone !== undefined) brand.tone = tone;
    if (status !== undefined) brand.status = status;

    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: brand.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/brands/:id
 * @desc    Soft-delete / archive a brand
 * @access  Private (Admin only)
 */
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    if (brand.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to archive brands from another organization',
      });
    }

    brand.status = 'archived';
    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Brand workspace archived successfully',
      data: brand.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
