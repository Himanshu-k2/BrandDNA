/**
 * Generic request validation middleware using Zod schemas.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against req.body
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || [];
    const formattedErrors = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed: Invalid request body',
      errors: formattedErrors,
    });
  }

  // Replace req.body with the sanitized/parsed data from Zod
  req.body = result.data;
  next();
};
