import { z } from 'zod';

export const createReviewSchema = z
  .object({
    brandId: z
      .string({ required_error: 'brandId is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid brandId format: must be a 24-character hexadecimal ObjectId'),
    content: z
      .string()
      .trim()
      .max(50000, 'content cannot exceed 50,000 characters')
      .optional()
      .default(''),
    contentType: z
      .string()
      .optional()
      .default('text'),
    title: z.string().trim().optional(),
    submissionNote: z.string().trim().optional(),
    files: z.array(z.any()).optional().default([]),
  })
  .passthrough()
  .refine(
    (data) => {
      const hasContent = Boolean(data.content && data.content.trim().length > 0);
      const hasFiles = Boolean(Array.isArray(data.files) && data.files.length > 0);
      return hasContent || hasFiles;
    },
    {
      message: 'content cannot be empty',
      path: ['content'],
    }
  );
