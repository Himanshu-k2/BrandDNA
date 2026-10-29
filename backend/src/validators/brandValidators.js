import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z
    .string({ required_error: 'Brand name is required' })
    .trim()
    .min(2, 'Brand name must be at least 2 characters')
    .max(100, 'Brand name cannot exceed 100 characters'),
  description: z.string().max(1000).optional(),
  tone: z.string().max(300).optional(),
});

export const updateBrandSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  tone: z.string().max(300).optional(),
  status: z.enum(['active', 'archived']).optional(),
});

const guidelineCategories = [
  'Tone of voice',
  'Writing style',
  'Messaging',
  'Required phrases',
  'Prohibited content',
  'Formatting',
  'Claims and disclaimers',
  'General',
];

export const createGuidelineSchema = z.object({
  title: z
    .string({ required_error: 'Guideline title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  category: z.enum(
    [
      'Tone of voice',
      'Writing style',
      'Messaging',
      'Required phrases',
      'Prohibited content',
      'Formatting',
      'Claims and disclaimers',
      'General',
    ],
    { required_error: 'Category is required' }
  ),
  ruleText: z
    .string({ required_error: 'Rule text is required' })
    .trim()
    .min(5, 'Rule text must be at least 5 characters')
    .max(2000, 'Rule text cannot exceed 2000 characters'),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

export const updateGuidelineSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  category: z
    .enum([
      'Tone of voice',
      'Writing style',
      'Messaging',
      'Required phrases',
      'Prohibited content',
      'Formatting',
      'Claims and disclaimers',
      'General',
    ])
    .optional(),
  ruleText: z.string().trim().min(5).max(2000).optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'archived', 'superseded']).optional(),
});

export const createFactSchema = z.object({
  key: z
    .string({ required_error: 'Fact key is required' })
    .trim()
    .toLowerCase()
    .min(1, 'Fact key cannot be empty')
    .max(100, 'Fact key cannot exceed 100 characters'),
  value: z
    .string({ required_error: 'Fact value is required' })
    .trim()
    .min(1, 'Fact value cannot be empty')
    .max(500, 'Fact value cannot exceed 500 characters'),
  description: z.string().max(1000).optional(),
  category: z
    .enum(['pricing', 'product', 'specifications', 'legal', 'general'])
    .optional(),
  sourceReference: z.string().max(300).optional(),
  verificationStatus: z.enum(['unverified', 'verified', 'disputed']).optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
});

export const updateFactSchema = z.object({
  key: z.string().trim().toLowerCase().min(1).max(100).optional(),
  value: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(1000).optional(),
  category: z
    .enum(['pricing', 'product', 'specifications', 'legal', 'general'])
    .optional(),
  sourceReference: z.string().max(300).optional(),
  verificationStatus: z.enum(['unverified', 'verified', 'disputed']).optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  status: z.enum(['active', 'archived']).optional(),
});

export const createTerminologySchema = z.object({
  preferredTerm: z
    .string({ required_error: 'Preferred term is required' })
    .trim()
    .min(1, 'Preferred term cannot be empty')
    .max(100, 'Preferred term cannot exceed 100 characters'),
  prohibitedTerm: z
    .string({ required_error: 'Prohibited term is required' })
    .trim()
    .min(1, 'Prohibited term cannot be empty')
    .max(100, 'Prohibited term cannot exceed 100 characters'),
  replacementSuggestion: z.string().trim().max(100).optional(),
  explanation: z.string().trim().max(1000).optional(),
  caseSensitive: z.boolean().optional(),
});

export const updateTerminologySchema = z.object({
  preferredTerm: z.string().trim().min(1).max(100).optional(),
  prohibitedTerm: z.string().trim().min(1).max(100).optional(),
  replacementSuggestion: z.string().trim().max(100).optional(),
  explanation: z.string().trim().max(1000).optional(),
  caseSensitive: z.boolean().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export const createVisualAssetSchema = z.object({
  name: z
    .string({ required_error: 'Visual asset name is required' })
    .trim()
    .min(2, 'Asset name must be at least 2 characters')
    .max(100, 'Asset name cannot exceed 100 characters'),
  assetType: z.enum(
    ['logo', 'logo_usage', 'color_palette', 'typography', 'badge', 'general_guideline'],
    { required_error: 'Valid visual asset type is required' }
  ),
  details: z.record(z.any()).optional().default({}),
});
