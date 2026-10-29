import mongoose from 'mongoose';

const guidelineHistorySchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    ruleText: { type: String, required: true },
    severity: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const brandGuidelineSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Guideline title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Tone of voice',
          'Writing style',
          'Messaging',
          'Required phrases',
          'Prohibited content',
          'Formatting',
          'Claims and disclaimers',
          'General',
        ],
        message: 'Invalid guideline category',
      },
      index: true,
    },
    ruleText: {
      type: String,
      required: [true, 'Rule text or description is required'],
      trim: true,
      maxlength: [2000, 'Rule text cannot exceed 2000 characters'],
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Severity must be low, medium, or high',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'archived', 'superseded'],
        message: 'Status must be active, archived, or superseded',
      },
      default: 'active',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    history: [guidelineHistorySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Compound index for querying active guidelines by brand and category
brandGuidelineSchema.index({ brandId: 1, status: 1, category: 1 });

const BrandGuideline = mongoose.model('BrandGuideline', brandGuidelineSchema);

export default BrandGuideline;
