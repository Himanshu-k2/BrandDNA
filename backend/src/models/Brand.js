import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      minlength: [2, 'Brand name must be at least 2 characters'],
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Organization ID is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    tone: {
      type: String,
      trim: true,
      default: 'Professional, clear, and encouraging',
    },
    visualIdentity: {
      primaryColors: {
        type: [String],
        default: [],
      },
      secondaryColors: {
        type: [String],
        default: [],
      },
      prohibitedColors: {
        type: [String],
        default: [],
      },
      logoRules: {
        minClearSpace: { type: String, default: '' },
        prohibitedModifications: { type: [String], default: [] },
        requiredPlacement: { type: String, default: '' },
      },
      typography: {
        primaryFont: { type: String, default: '' },
        secondaryFont: { type: String, default: '' },
      },
      visualTone: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'archived'],
        message: 'Status must be active or archived',
      },
      default: 'active',
      index: true,
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

// Compound index to ensure brand names are unique per organization
brandSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
