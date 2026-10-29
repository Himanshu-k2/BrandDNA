import mongoose from 'mongoose';

const brandVisualAssetSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand ID is required'],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    assetType: {
      type: String,
      enum: {
        values: ['logo', 'logo_usage', 'color_palette', 'typography', 'badge', 'general_guideline'],
        message: 'Invalid visual asset type',
      },
      required: [true, 'Asset type is required'],
    },
    details: {
      hexColors: {
        type: [String],
        default: [],
      },
      colorRole: {
        type: String,
        default: 'primary',
      },
      prohibitedColors: {
        type: [String],
        default: [],
      },
      logoRules: {
        type: String,
        default: '',
      },
      fontFamily: {
        type: String,
        default: '',
      },
      notes: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

brandVisualAssetSchema.index({ brandId: 1, status: 1 });

const BrandVisualAsset = mongoose.model('BrandVisualAsset', brandVisualAssetSchema);

export default BrandVisualAsset;
