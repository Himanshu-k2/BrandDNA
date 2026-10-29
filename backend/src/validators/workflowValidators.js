import { z } from 'zod';

export const createRevisionSchema = z.object({
  content: z
    .string({ required_error: 'content is required' })
    .trim()
    .min(1, 'content cannot be empty')
    .max(50000, 'content cannot exceed 50,000 characters'),
  submissionNote: z.string().trim().max(1000).optional(),
});

export const createCommentSchema = z.object({
  body: z
    .string({ required_error: 'Comment body is required' })
    .trim()
    .min(1, 'Comment body cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters'),
  commentType: z
    .enum(['general_feedback', 'requested_change', 'question'])
    .optional()
    .default('general_feedback'),
  versionNumber: z.number().int().positive().optional(),
});

export const approveReviewSchema = z.object({
  comment: z.string().trim().max(1000).optional(),
});

export const rejectReviewSchema = z.object({
  reason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters')
    .max(1000, 'Rejection reason cannot exceed 1000 characters'),
});

export const requestChangesSchema = z.object({
  reason: z
    .string({ required_error: 'Reason for requesting changes is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
});
