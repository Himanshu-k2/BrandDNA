import { z } from 'zod';

export const createReviewSchema = z.object({
  brandId: z
    .string({ required_error: 'brandId is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid brandId format: must be a 24-character hexadecimal ObjectId'),
  content: z
    .string({ required_error: 'content is required' })
    .trim()
    .min(1, 'content cannot be empty')
    .max(50000, 'content cannot exceed 50,000 characters'),
  contentType: z
    .enum(['text', 'social_post', 'advertisement', 'article', 'email', 'product_copy'])
    .optional()
    .default('text'),
});
