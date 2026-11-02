import { z } from 'zod';
import { fileItemSchema } from './reviewValidator.js';

export const createRevisionSchema = z
  .object({
    content: z.string().trim().max(50000, 'content cannot exceed 50,000 characters').optional().default(''),
    submissionNote: z.string().trim().max(1000).optional(),
    files: z.array(fileItemSchema).max(5, 'Maximum 5 files allowed per revision').optional().default([]),
  })
  .passthrough();

export const createCommentSchema = z
  .object({
    body: z
      .string({ required_error: 'Comment body is required' })
      .trim()
      .min(1, 'Comment body cannot be empty')
      .max(2000, 'Comment cannot exceed 2000 characters')
      .or(z.string().trim().min(1)),
    content: z.string().trim().optional(),
    commentType: z
      .enum(['general_feedback', 'requested_change', 'question'])
      .optional()
      .default('general_feedback'),
    versionNumber: z.number().int().positive().optional(),
  })
  .transform((data) => ({
    body: data.body || data.content || '',
    commentType: data.commentType,
    versionNumber: data.versionNumber,
  }));

export const approveReviewSchema = z
  .object({
    comment: z.string().trim().max(1000).optional(),
    reviewerNotes: z.string().trim().max(1000).optional(),
  })
  .transform((data) => ({
    comment: data.comment || data.reviewerNotes || '',
  }));

export const rejectReviewSchema = z
  .object({
    reason: z.string().trim().max(1000).optional(),
    reviewerNotes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Boolean(data.reason || data.reviewerNotes), {
    message: 'Rejection reason is required',
  })
  .transform((data) => ({
    reason: data.reason || data.reviewerNotes || '',
  }));

export const requestChangesSchema = z
  .object({
    reason: z.string().trim().max(1000).optional(),
    reviewerNotes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Boolean(data.reason || data.reviewerNotes), {
    message: 'Reason for requesting changes is required',
  })
  .transform((data) => ({
    reason: data.reason || data.reviewerNotes || '',
  }));
