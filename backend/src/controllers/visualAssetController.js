import Brand from '../models/Brand.js';
import BrandVisualAsset from '../models/BrandVisualAsset.js';

/**
 * @route   POST /api/brands/:id/visual-assets
 * @desc    Add a brand visual reference asset (logo rule, color palette, badge)
 * @access  Private (Admin only)
 */
export const createVisualAsset = async (req, res, next) => {
  try {
    const { name, assetType, details } = req.body;
    const brandId = req.params.id;
    const organizationId = req.user.organizationId;

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand workspace not found' });
    }

    if (brand.organizationId.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify visual assets for another organization brand',
      });
    }

    const asset = new BrandVisualAsset({
      brandId,
      organizationId,
      name,
      assetType,
      details: details || {},
      createdBy: req.user._id,
      status: 'active',
    });

    await asset.save();

    res.status(201).json({
      success: true,
      message: 'Brand visual asset registered successfully',
      data: asset.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/brands/:id/visual-assets
 * @desc    List active visual assets for a brand workspace
 * @access  Private (Admin, Creator, Reviewer)
 */
export const getVisualAssetsByBrand = async (req, res, next) => {
  try {
    const brandId = req.params.id;
    const organizationId = req.user.organizationId;

    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand workspace not found' });
    }

    if (brand.organizationId.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access visual assets from another organization',
      });
    }

    const assets = await BrandVisualAsset.find({
      brandId,
      status: 'active',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assets.map((a) => a.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/visual-assets/:id
 * @desc    Archive / soft-delete a visual asset
 * @access  Private (Admin only)
 */
export const deleteVisualAsset = async (req, res, next) => {
  try {
    const asset = await BrandVisualAsset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Visual asset not found' });
    }

    if (asset.organizationId.toString() !== req.user.organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete visual assets belonging to another organization',
      });
    }

    asset.status = 'archived';
    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Visual asset archived successfully',
      data: asset.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
