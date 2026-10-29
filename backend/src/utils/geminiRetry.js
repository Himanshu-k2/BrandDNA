/**
 * Gemini API Retry and Resilience Utility.
 * Provides bounded retries with exponential backoff and full jitter
 * for transient errors (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, timeouts, network drops),
 * while immediately failing on permanent errors (400, 401, 403, 404).
 */

/**
 * Checks whether an error is transient (temporary/retryable) or permanent.
 * Permanent errors (400, 401, 403, 404, invalid keys, invalid argument) must NEVER be retried.
 *
 * @param {Error|Object} error - Error thrown by Gemini API / HTTP client
 * @returns {boolean} True if the error is temporary and can be retried
 */
export const isTransientGeminiError = (error) => {
  if (!error) return false;

  const rawStatus = error.status || error.statusCode || error.code;
  const statusNum = typeof rawStatus === 'number' ? rawStatus : parseInt(rawStatus, 10);
  const statusStr = String(rawStatus || '').toUpperCase();
  const message = String(error.message || '').toLowerCase();

  // 1. Explicit permanent HTTP status codes or status strings (DO NOT RETRY)
  if (
    statusNum === 400 ||
    statusNum === 401 ||
    statusNum === 403 ||
    statusNum === 404 ||
    statusStr === 'INVALID_ARGUMENT' ||
    statusStr === 'UNAUTHENTICATED' ||
    statusStr === 'PERMISSION_DENIED' ||
    statusStr === 'NOT_FOUND'
  ) {
    return false;
  }

  // 2. Explicit permanent keywords in message (DO NOT RETRY)
  if (
    message.includes('api_key_invalid') ||
    message.includes('api key not valid') ||
    message.includes('invalid api key') ||
    message.includes('permission_denied') ||
    message.includes('permission denied') ||
    message.includes('invalid_argument') ||
    message.includes('model not found') ||
    (message.includes('401') && !message.includes('503')) ||
    (message.includes('403') && !message.includes('503')) ||
    (message.includes('400') && !message.includes('503'))
  ) {
    return false;
  }

  // 3. Explicit transient HTTP status codes or status strings (RETRY)
  if (
    statusNum === 503 ||
    statusNum === 429 ||
    statusNum === 500 ||
    statusNum === 502 ||
    statusNum === 504 ||
    statusStr === 'UNAVAILABLE' ||
    statusStr === 'RESOURCE_EXHAUSTED' ||
    statusStr === 'DEADLINE_EXCEEDED' ||
    statusStr === 'INTERNAL' ||
    statusStr === 'ETIMEDOUT' ||
    statusStr === 'ECONNRESET' ||
    statusStr === 'ECONNREFUSED' ||
    statusStr === 'ESOCKETTIMEDOUT'
  ) {
    return true;
  }

  // 4. Pattern matching on message for transient / demand / timeout issues (RETRY)
  if (
    /503|unavailable|high\s*demand|temporar(y|ily)|overloaded|spikes\s*in\s*demand/i.test(message) ||
    /429|resource_exhausted|too\s*many\s*requests|rate\s*limit|quota\s*exceeded/i.test(message) ||
    /500|502|504|bad\s*gateway|gateway\s*timeout|internal\s*server\s*error/i.test(message) ||
    /timeout|timed\s*out|etimedout|esockettimedout|deadline\s*exceeded/i.test(message) ||
    /econnreset|econnrefused|socket\s*hang\s*up|fetch\s*failed|network\s*error/i.test(message) ||
    error.name === 'TimeoutError' ||
    error.name === 'AbortError'
  ) {
    return true;
  }

  return false;
};

/**
 * Calculates exponential backoff delay with decorrelated jitter.
 * When in test mode (NODE_ENV === 'test'), uses small delays (10-50ms) to ensure fast test suites.
 *
 * @param {number} attempt - Current retry attempt index (0-based)
 * @param {Object} [options]
 * @param {number} [options.baseDelay] - Initial delay in ms (default: 800ms, or 10ms in test)
 * @param {number} [options.maxDelay] - Cap on delay in ms (default: 5000ms, or 50ms in test)
 * @param {number} [options.factor=2] - Exponential multiplier
 * @returns {number} Delay in milliseconds
 */
export const calculateBackoffDelay = (attempt, options = {}) => {
  const isTest = process.env.NODE_ENV === 'test';
  const baseDelay = options.baseDelay ?? (isTest ? 10 : 800);
  const maxDelay = options.maxDelay ?? (isTest ? 50 : 5000);
  const factor = options.factor ?? 2;

  // Exponential growth capped at maxDelay
  const expDelay = Math.min(maxDelay, baseDelay * Math.pow(factor, attempt));
  // Full jitter: uniformly randomized between 50% and 100% of expDelay
  const minDelay = Math.floor(expDelay * 0.5);
  const jitter = Math.random() * (expDelay - minDelay);
  return Math.floor(minDelay + jitter);
};

/**
 * Promise-based sleep helper.
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes an async operation with bounded retries and exponential backoff with jitter
 * for transient errors (503, 429, timeouts). Non-transient errors (400, 401, 403, 404)
 * fail immediately without retry.
 *
 * Supports an optional secondary fallback model (e.g. gemini-3-flash-preview)
 * if the primary model (gemini-3.8-flash) exhausts bounded retries due to persistent demand spikes.
 *
 * @param {Function} apiCallFn - Async function (currentModel, attempt) => Promise<any>
 * @param {Object} [options]
 * @param {number} [options.maxRetries=3] - Maximum retry attempts per model
 * @param {string} [options.primaryModel] - Primary model name
 * @param {string} [options.fallbackModel] - Secondary fallback model
 * @param {string} [options.operationName='Gemini API'] - Logging label
 * @param {number} [options.baseDelay] - Base backoff delay in ms
 * @param {number} [options.maxDelay] - Max backoff delay in ms
 * @param {Function} [options.onRetry] - Optional hook called before each retry
 * @returns {Promise<any>}
 */
export const callWithRetry = async (apiCallFn, options = {}) => {
  const {
    maxRetries = 3,
    primaryModel = null,
    fallbackModel = null,
    operationName = 'Gemini API call',
    baseDelay,
    maxDelay,
    onRetry,
  } = options;

  let currentModel = primaryModel;
  let lastError = null;
  let hasFallenBack = false;
  let allowedRetries = maxRetries;

  for (let attempt = 0; attempt <= allowedRetries; attempt++) {
    try {
      return await apiCallFn(currentModel, attempt);
    } catch (error) {
      lastError = error;

      // 1. Permanent non-transient error: Fail immediately without retrying
      if (!isTransientGeminiError(error)) {
        console.warn(`🛑 Non-retryable error in ${operationName} (model: ${currentModel}): ${error.message}`);
        throw error;
      }

      // 2. If retries remain for current model: Wait with exponential backoff and retry
      if (attempt < allowedRetries) {
        const delayMs = calculateBackoffDelay(attempt, { baseDelay, maxDelay });
        console.warn(
          `⚠️ Transient error in ${operationName} [${currentModel}] (attempt ${attempt + 1}/${allowedRetries + 1}): ${error.message}. Retrying in ${delayMs}ms...`
        );
        if (typeof onRetry === 'function') {
          onRetry({ attempt, delayMs, error, model: currentModel });
        }
        await sleep(delayMs);
        continue;
      }

      // 3. If primary model exhausted all retries and a distinct fallback model is provided
      if (!hasFallenBack && fallbackModel && fallbackModel !== currentModel) {
        console.warn(
          `🔄 Primary model [${currentModel}] exhausted ${allowedRetries + 1} attempts (${error.message}). Attempting fallback to model [${fallbackModel}]...`
        );
        hasFallenBack = true;
        currentModel = fallbackModel;
        attempt = -1; // Reset attempt loop for fallback model
        allowedRetries = 1; // Allow 1 retry on fallback
        continue;
      }

      // Out of retries and fallback options
      break;
    }
  }

  throw lastError;
};
