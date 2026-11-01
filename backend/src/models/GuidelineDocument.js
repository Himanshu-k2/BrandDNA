import mongoose from 'mongoose';

const extractedItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['guideline', 'fact', 'terminology', 'visual_asset'],
    default: 'guideline',
  },
  title: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    default: 'warning',
  },
  content: {
    type: String,
    required: true,
  },
  factKey: {
    type: String,
    default: null,
  },
  factValue: {
    type: String,
    default: null,
  },
  prohibitedTerm: {
    type: String,
    default: null,
  },
  preferredTerm: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
});

const guidelineDocumentSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    rawText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'completed'],
      default: 'in_review',
    },
    extractedItems: [extractedItemSchema],
  },
  {
    timestamps: true,
  }
);

const GuidelineDocument = mongoose.model('GuidelineDocument', guidelineDocumentSchema);

export default GuidelineDocument;

