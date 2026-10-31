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

const normalizeCategory = (cat) => {
  if (!cat) return 'General';
  const c = cat.toLowerCase().trim();
  if (c.includes('tone') || c.includes('voice')) return 'Tone of voice';
  if (c.includes('style') || c.includes('writing')) return 'Writing style';
  if (c.includes('message') || c.includes('messaging')) return 'Messaging';
  if (c.includes('phrase') || c.includes('required')) return 'Required phrases';
  if (c.includes('prohibit')) return 'Prohibited content';
  if (c.includes('claim') || c.includes('disclaimer')) return 'Claims and disclaimers';
  if (c.includes('format')) return 'Formatting';
  return 'General';
};

const normalizeSeverity = (sev) => {
  if (!sev) return 'medium';
  const s = sev.toLowerCase().trim();
  if (s === 'warning') return 'medium';
  if (s === 'info') return 'low';
  if (['low', 'medium', 'high', 'critical'].includes(s)) return s;
  return 'medium';
};

export const createGuidelineSchema = z
  .object({
    title: z
      .string({ required_error: 'Guideline title is required' })
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(200, 'Title cannot exceed 200 characters'),
    category: z.string().optional(),
    ruleText: z.string().trim().max(2000).optional(),
    rule: z.string().trim().max(2000).optional(),
    severity: z.string().optional(),
  })
  .refine((data) => Boolean(data.ruleText || data.rule), {
    message: 'Rule text is required',
  })
  .transform((data) => ({
    title: data.title,
    category: normalizeCategory(data.category),
    ruleText: data.ruleText || data.rule,
    severity: normalizeSeverity(data.severity),
  }));

export const updateGuidelineSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    category: z.string().optional(),
    ruleText: z.string().trim().max(2000).optional(),
    rule: z.string().trim().max(2000).optional(),
    severity: z.string().optional(),
    status: z.enum(['active', 'archived', 'superseded']).optional(),
  })
  .transform((data) => {
    const res = { ...data };
    if (data.category) res.category = normalizeCategory(data.category);
    if (data.rule && !data.ruleText) res.ruleText = data.rule;
    if (data.severity) res.severity = normalizeSeverity(data.severity);
    delete res.rule;
    return res;
  });

export const createFactSchema = z
  .object({
    key: z.string().trim().toLowerCase().max(100).optional(),
    factKey: z.string().trim().toLowerCase().max(100).optional(),
    value: z.string().trim().max(500).optional(),
    factValue: z.string().trim().max(500).optional(),
    description: z.string().max(1000).optional(),
    category: z.string().optional().default('general'),
    sourceReference: z.string().max(300).optional(),
    source: z.string().max(300).optional(),
    verificationStatus: z.enum(['unverified', 'verified', 'disputed']).optional().default('verified'),
    validFrom: z.string().datetime().optional().nullable(),
    validUntil: z.string().datetime().optional().nullable(),
  })
  .refine((data) => Boolean(data.key || data.factKey), {
    message: 'Fact key is required',
  })
  .refine((data) => Boolean(data.value || data.factValue), {
    message: 'Fact value is required',
  })
  .transform((data) => {
    const cat = (data.category || 'general').toLowerCase();
    const validCat = ['pricing', 'product', 'specifications', 'legal', 'general'].includes(cat)
      ? cat
      : 'general';
    return {
      key: data.key || data.factKey,
      value: data.value || data.factValue,
      description: data.description || '',
      category: validCat,
      sourceReference: data.sourceReference || data.source || 'Internal Reference',
      verificationStatus: data.verificationStatus || 'verified',
      validFrom: data.validFrom,
      validUntil: data.validUntil,
    };
  });

export const updateFactSchema = z
  .object({
    key: z.string().trim().toLowerCase().max(100).optional(),
    factKey: z.string().trim().toLowerCase().max(100).optional(),
    value: z.string().trim().max(500).optional(),
    factValue: z.string().trim().max(500).optional(),
    description: z.string().max(1000).optional(),
    category: z.string().optional(),
    sourceReference: z.string().max(300).optional(),
    source: z.string().max(300).optional(),
    verificationStatus: z.enum(['unverified', 'verified', 'disputed']).optional(),
    validFrom: z.string().datetime().optional().nullable(),
    validUntil: z.string().datetime().optional().nullable(),
    status: z.enum(['active', 'archived']).optional(),
  })
  .transform((data) => {
    const res = { ...data };
    if (data.factKey && !data.key) res.key = data.factKey;
    if (data.factValue && !data.value) res.value = data.factValue;
    if (data.source && !data.sourceReference) res.sourceReference = data.source;
    if (data.category) {
      const cat = data.category.toLowerCase();
      res.category = ['pricing', 'product', 'specifications', 'legal', 'general'].includes(cat)
        ? cat
        : 'general';
    }
    delete res.factKey;
    delete res.factValue;
    delete res.source;
    return res;
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
  caseSensitive: z.boolean().optional().default(false),
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
