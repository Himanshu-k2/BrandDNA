import mongoose from 'mongoose';

const factHistorySchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
    sourceReference: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const approvedFactSchema = new mongoose.Schema(
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
    key: {
      type: String,
      required: [true, 'Fact key is required (e.g., subscription_price)'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Fact key cannot exceed 100 characters'],
      index: true,
    },
    value: {
      type: String,
      required: [true, 'Fact value is required (e.g., ₹999)'],
      trim: true,
      maxlength: [500, 'Fact value cannot exceed 500 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: {
        values: ['pricing', 'product', 'specifications', 'legal', 'general'],
        message: 'Invalid fact category',
      },
      default: 'general',
      index: true,
    },
    sourceReference: {
      type: String,
      trim: true,
      maxlength: [300, 'Source reference cannot exceed 300 characters'],
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['unverified', 'verified', 'disputed'],
        message: 'Verification status must be unverified, verified, or disputed',
      },
      default: 'verified',
      index: true,
    },
    validFrom: {
      type: Date,
      default: null,
    },
    validUntil: {
      type: Date,
      default: null,
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
    version: {
      type: Number,
      default: 1,
    },
    history: [factHistorySchema],
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

// Compound index for querying verified active facts for a brand
approvedFactSchema.index({ brandId: 1, status: 1, verificationStatus: 1 });

const ApprovedFact = mongoose.model('ApprovedFact', approvedFactSchema);

export default ApprovedFact;
