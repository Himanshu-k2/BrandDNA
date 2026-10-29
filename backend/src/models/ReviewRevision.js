import mongoose from 'mongoose';

const fileAssetSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    pageCount: { type: Number, default: null },
    dimensions: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    extractedText: { type: String, default: '' },
    pageSummaries: [
      {
        pageNumber: Number,
        characterCount: Number,
        hasExtractableText: Boolean,
      },
    ],
    unanalyzablePages: [Number],
  },
  { _id: false }
);

const reviewRevisionSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentReview',
      required: [true, 'Review ID is required'],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Organization ID is required'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: [true, 'Version number is required'],
    },
    contentSnapshot: {
      type: String,
      default: '',
    },
    modality: {
      type: String,
      enum: ['text', 'document', 'image', 'multimodal'],
      default: 'text',
    },
    contentType: {
      type: String,
      default: 'text',
    },
    fileAsset: {
      type: fileAssetSchema,
      default: null,
      required: false,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted by user is required'],
    },
    submissionNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Submission note cannot exceed 1000 characters'],
      default: '',
    },
    findings: [
      {
        findingId: {
          type: String,
          default: () => new mongoose.Types.ObjectId().toString(),
        },
        type: { type: String, required: true },
        severity: { type: String, required: true },
        problematicText: { type: String, default: '' },
        explanation: { type: String, required: true },
        suggestedCorrection: { type: String, default: '' },
        sourceType: { type: String, required: true },
        sourceId: { type: String, default: null },
        confidence: { type: String, default: 'high' },
        analysisVersion: { type: Number, default: 1 },
        analysisStatus: {
          type: String,
          enum: [
            'confirmed_mismatch',
            'guideline_violation',
            'visual_branding_violation',
            'contextual_ai_concern',
            'needs_verification',
            'insufficient_evidence',
          ],
          default: 'confirmed_mismatch',
        },
        pageNumber: {
          type: Number,
          default: null,
        },
        boundingBox: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        imageRegion: {
          type: String,
          default: null,
        },
        evidence: {
          type: String,
          default: '',
        },
        reviewModality: {
          type: String,
          enum: ['text', 'document', 'image-text', 'visual-branding'],
          default: 'text',
        },
      },
    ],
    summary: {
      totalFindings: { type: Number, default: 0 },
      highSeverityCount: { type: Number, default: 0 },
      mediumSeverityCount: { type: Number, default: 0 },
      lowSeverityCount: { type: Number, default: 0 },
      overallScore: { type: Number, default: 100 },
      recommendation: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: [
        'draft',
        'needs_changes',
        'pending_approval',
        'approved',
        'rejected',
        'superseded',
      ],
      default: 'pending_approval',
      index: true,
    },
    checksCompleted: {
      deterministicRules: { type: Boolean, default: false },
      terminology: { type: Boolean, default: false },
      pricingAndFacts: { type: Boolean, default: false },
      geminiContextual: { type: Boolean, default: false },
    },
    warnings: [{ type: String }],
    isPartialAnalysis: { type: Boolean, default: false },
    guidelineVersions: { type: mongoose.Schema.Types.Mixed, default: {} },
    factVersions: { type: mongoose.Schema.Types.Mixed, default: {} },
    analyzedAt: { type: Date, default: Date.now },
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

// Compound index to guarantee uniqueness of version numbers per review
reviewRevisionSchema.index({ reviewId: 1, versionNumber: 1 }, { unique: true });

const ReviewRevision = mongoose.model('ReviewRevision', reviewRevisionSchema);

export default ReviewRevision;
