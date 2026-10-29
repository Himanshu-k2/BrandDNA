import mongoose from 'mongoose';

const reviewCommentSchema = new mongoose.Schema(
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
      default: 1,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      minlength: [1, 'Comment body cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    commentType: {
      type: String,
      enum: {
        values: ['general_feedback', 'requested_change', 'question'],
        message: 'Invalid comment type',
      },
      default: 'general_feedback',
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

reviewCommentSchema.index({ reviewId: 1, createdAt: 1 });

const ReviewComment = mongoose.model('ReviewComment', reviewCommentSchema);

export default ReviewComment;
