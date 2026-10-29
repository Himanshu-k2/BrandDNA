import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 review requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many review requests submitted from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for expensive AI review submission endpoints.
 * Automatically disabled during automated testing.
 */
export const reviewRateLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return limiter(req, res, next);
};
