import mongoose from 'mongoose';

const terminologyRuleSchema = new mongoose.Schema(
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
    preferredTerm: {
      type: String,
      required: [true, 'Preferred term is required (e.g., members)'],
      trim: true,
      maxlength: [100, 'Preferred term cannot exceed 100 characters'],
    },
    prohibitedTerm: {
      type: String,
      required: [true, 'Prohibited term is required (e.g., users)'],
      trim: true,
      maxlength: [100, 'Prohibited term cannot exceed 100 characters'],
    },
    replacementSuggestion: {
      type: String,
      trim: true,
      maxlength: [100, 'Replacement suggestion cannot exceed 100 characters'],
      default: '',
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
      default: '',
    },
    caseSensitive: {
      type: Boolean,
      default: false,
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

// Pre-save hook to populate replacementSuggestion if left empty
terminologyRuleSchema.pre('save', function (next) {
  if (!this.replacementSuggestion) {
    this.replacementSuggestion = this.preferredTerm;
  }
  next();
});

// Index to query active terminology rules by brand
terminologyRuleSchema.index({ brandId: 1, status: 1 });

const TerminologyRule = mongoose.model('TerminologyRule', terminologyRuleSchema);

export default TerminologyRule;
