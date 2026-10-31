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

const revisionFindingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    title: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    type: { type: String, required: true },
    severity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    problematicText: { type: String, default: '' },
    location: { type: String, default: '' },
    explanation: { type: String, required: true },
    expectedValue: { type: String, default: '' },
    detectedValue: { type: String, default: '' },
    suggestedCorrection: { type: String, default: '' },
    sourceType: { type: String, required: true },
    sourceId: { type: String, default: null },
    evidenceType: { type: String, default: '' },
    evidenceId: { type: String, default: null },
    evidenceName: { type: String, default: '' },
    analysisSource: {
      type: String,
      enum: ['rule_based', 'gemini', 'both'],
      default: 'rule_based',
    },
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
    pageNumber: { type: Number, default: null },
    boundingBox: { type: mongoose.Schema.Types.Mixed, default: null },
    imageRegion: { type: String, default: null },
    evidence: { type: String, default: '' },
    reviewModality: {
      type: String,
      enum: ['text', 'document', 'image-text', 'visual-branding'],
      default: 'text',
    },
  },
  {
    _id: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.originalText = ret.problematicText || '';
        ret.finding = ret.title || ret.type?.replace(/_/g, ' ') || 'Compliance finding';
        ret.suggestion = ret.suggestedCorrection || '';
        ret.evidenceSource = ret.evidenceName || ret.evidence || ret.sourceType || '';
        return ret;
      },
    },
  }
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
    findings: [revisionFindingSchema],
    summary: {
      totalFindings: { type: Number, default: 0 },
      criticalSeverityCount: { type: Number, default: 0 },
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
    analysisCompletionStatus: {
      type: String,
      enum: ['complete', 'partial', 'failed'],
      default: 'complete',
    },
    analysisMetadata: {
      methodsRan: [{ type: String }],
      fallbackUsed: { type: Boolean, default: false },
      geminiAvailable: { type: Boolean, default: true },
      timestamp: { type: Date, default: Date.now },
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
    evidenceSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
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
