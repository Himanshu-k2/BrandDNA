import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    type: {
      type: String,
      required: true,
      enum: [
        'incorrect_fact',
        'incorrect_price',
        'terminology_violation',
        'tone_inconsistency',
        'guideline_violation',
        'unsupported_claim',
        'required_phrase_missing',
        'needs_verification',
        'visual_branding_violation',
        'color_palette_mismatch',
        'logo_misuse',
        'typography_inconsistency',
        'layout_contrast_issue',
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
    },
    problematicText: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      required: true,
    },
    suggestedCorrection: {
      type: String,
      default: '',
    },
    sourceType: {
      type: String,
      enum: ['approved_fact', 'brand_guideline', 'terminology_rule', 'visual_asset', 'ai_analysis'],
      required: true,
    },
    sourceId: {
      type: String,
      default: null,
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
    },
    analysisVersion: {
      type: Number,
      default: 1,
    },
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
  { _id: true }
);

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

const contentReviewSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Organization ID is required'],
      index: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand ID is required'],
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted by user is required'],
      index: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: [50000, 'Content cannot exceed 50,000 characters'],
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
    status: {
      type: String,
      enum: [
        'draft',
        'analyzing',
        'needs_changes',
        'pending_approval',
        'approved',
        'rejected',
        'analysis_failed',
      ],
      default: 'analyzing',
      index: true,
    },
    findings: [findingSchema],
    summary: {
      totalFindings: { type: Number, default: 0 },
      highSeverityCount: { type: Number, default: 0 },
      mediumSeverityCount: { type: Number, default: 0 },
      lowSeverityCount: { type: Number, default: 0 },
      overallScore: { type: Number, default: 100 },
      recommendation: { type: String, default: '' },
    },
    checksCompleted: {
      deterministicRules: { type: Boolean, default: false },
      terminology: { type: Boolean, default: false },
      pricingAndFacts: { type: Boolean, default: false },
      geminiContextual: { type: Boolean, default: false },
    },
    warnings: [
      {
        type: String,
      },
    ],
    isPartialAnalysis: {
      type: Boolean,
      default: false,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    decision: {
      status: {
        type: String,
        enum: ['none', 'approved', 'rejected', 'changes_requested'],
        default: 'none',
      },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      decidedAt: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        default: '',
      },
    },
    guidelineVersions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    factVersions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
    isStale: {
      type: Boolean,
      default: false,
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

// Indexes for fast lookup by org, brand, and user
contentReviewSchema.index({ organizationId: 1, createdAt: -1 });
contentReviewSchema.index({ brandId: 1, createdAt: -1 });

const ContentReview = mongoose.model('ContentReview', contentReviewSchema);

export default ContentReview;
