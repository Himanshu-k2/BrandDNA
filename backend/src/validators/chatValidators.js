import { z } from 'zod';

export const chatSchema = z.object({
  message: z
    .string({ required_error: 'A message string is required to chat with Brad.' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4,000 characters'),
  context: z
    .object({
      role: z.enum(['admin', 'creator', 'brand_manager', 'reviewer']).optional(),
      personaName: z.string().trim().max(100).optional(),
      personaEmail: z.string().trim().max(100).optional(),
      pathname: z.string().trim().max(200).optional(),
      workspaceId: z.string().trim().max(100).optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  history: z
    .array(
      z.object({
        role: z.string().trim().max(50).optional(),
        text: z.string().trim().max(4000).optional(),
        content: z.string().trim().max(4000).optional(),
      }).passthrough()
    )
    .max(20, 'History cannot exceed 20 messages')
    .optional()
    .default([]),
});

