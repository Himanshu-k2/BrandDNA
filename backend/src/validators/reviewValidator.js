import { z } from 'zod';

export const fileItemSchema = z
  .object({
    filename: z.string().trim().max(255).optional(),
    fileType: z
      .string()
      .trim()
      .regex(/^(image\/(png|jpeg|jpg|webp)|application\/pdf)$/i, 'Allowed file types are PNG, JPEG, WebP, and PDF')
      .optional(),
    fileData: z.string().max(15 * 1024 * 1024, 'Base64 file payload cannot exceed 15MB').optional(),
    fileSize: z.number().max(10 * 1024 * 1024, 'File size cannot exceed 10MB').optional(),
  })
  .passthrough();

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
    title: z.string().trim().max(200).optional(),
    submissionNote: z.string().trim().max(1000).optional(),
    files: z.array(fileItemSchema).max(5, 'Maximum 5 files allowed per submission').optional().default([]),
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
