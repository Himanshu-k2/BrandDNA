import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isTransientGeminiError,
  calculateBackoffDelay,
  callWithRetry,
} from '../src/utils/geminiRetry.js';

describe('Gemini Resilience & Retry Engine Tests', () => {
  // =========================================================================
  // 1. Transient vs Permanent Error Classification Tests
  // =========================================================================
  describe('Error Classification: isTransientGeminiError', () => {
    test('1. Identifies HTTP 503 UNAVAILABLE as transient retryable error', () => {
      const err1 = new Error('503 UNAVAILABLE: Model is overloaded');
      err1.status = 503;
      assert.equal(isTransientGeminiError(err1), true);

      const err2 = new Error('This model is currently experiencing high demand. Spikes in demand are usually temporary.');
      assert.equal(isTransientGeminiError(err2), true);

      const err3 = { status: 'UNAVAILABLE', message: 'Service temporarily unavailable' };
      assert.equal(isTransientGeminiError(err3), true);
    });

    test('2. Identifies HTTP 429 RESOURCE_EXHAUSTED as transient retryable error', () => {
      const err = new Error('429 RESOURCE_EXHAUSTED: Rate limit exceeded');
      err.status = 429;
      assert.equal(isTransientGeminiError(err), true);

      const err2 = new Error('Quota exceeded for quota metric');
      assert.equal(isTransientGeminiError(err2), true);
    });

    test('3. Identifies Timeouts, Deadlines, and Network Disconnects as transient', () => {
      const timeoutErr = new Error('ETIMEDOUT: connect timed out');
      timeoutErr.code = 'ETIMEDOUT';
      assert.equal(isTransientGeminiError(timeoutErr), true);

      const deadlineErr = new Error('Deadline expired before operation could complete.');
      deadlineErr.status = 504;
      assert.equal(isTransientGeminiError(deadlineErr), true);

      const socketErr = new Error('socket hang up');
      assert.equal(isTransientGeminiError(socketErr), true);

      const connResetErr = new Error('ECONNRESET');
      connResetErr.code = 'ECONNRESET';
      assert.equal(isTransientGeminiError(connResetErr), true);
    });

    test('4. Identifies HTTP 401 / UNAUTHENTICATED / Invalid Key as permanent non-retryable', () => {
      const authErr = new Error('API_KEY_INVALID: API key not valid. Please pass a valid API key.');
      authErr.status = 401;
      assert.equal(isTransientGeminiError(authErr), false);

      const invalidKeyErr = new Error('Invalid API key provided');
      assert.equal(isTransientGeminiError(invalidKeyErr), false);
    });

    test('5. Identifies HTTP 403 / PERMISSION_DENIED as permanent non-retryable', () => {
      const permErr = new Error('PERMISSION_DENIED: Method doesn\'t allow unregistered callers');
      permErr.status = 403;
      assert.equal(isTransientGeminiError(permErr), false);
    });

    test('6. Identifies HTTP 400 / INVALID_ARGUMENT as permanent non-retryable', () => {
      const badArgErr = new Error('INVALID_ARGUMENT: Schema mismatch or invalid parameter');
      badArgErr.status = 400;
      assert.equal(isTransientGeminiError(badArgErr), false);
    });

    test('7. Identifies HTTP 404 / NOT_FOUND as permanent non-retryable', () => {
      const notFoundErr = new Error('NOT_FOUND: models/unknown-model is not found');
      notFoundErr.status = 404;
      assert.equal(isTransientGeminiError(notFoundErr), false);
    });
  });

  // =========================================================================
  // 2. Exponential Backoff & Jitter Calculation Tests
  // =========================================================================
  describe('Backoff Calculation: calculateBackoffDelay', () => {
    test('1. Calculates bounded exponential delay with jitter in test mode', () => {
      const delay0 = calculateBackoffDelay(0, { baseDelay: 10, maxDelay: 50 });
      const delay1 = calculateBackoffDelay(1, { baseDelay: 10, maxDelay: 50 });
      const delay2 = calculateBackoffDelay(2, { baseDelay: 10, maxDelay: 50 });

      assert.ok(delay0 >= 5 && delay0 <= 15, `delay0 ${delay0} out of range`);
      assert.ok(delay1 >= 10 && delay1 <= 25, `delay1 ${delay1} out of range`);
      assert.ok(delay2 >= 20 && delay2 <= 45, `delay2 ${delay2} out of range`);
    });

    test('2. Caps delay strictly at maxDelay', () => {
      const highAttemptDelay = calculateBackoffDelay(10, { baseDelay: 100, maxDelay: 500 });
      assert.ok(highAttemptDelay <= 500, `Delay ${highAttemptDelay} exceeded maxDelay`);
    });
  });

  // =========================================================================
  // 3. Retry Execution Logic Tests (callWithRetry)
  // =========================================================================
  describe('Retry Orchestrator: callWithRetry', () => {
    test('1. Resolves immediately when operation succeeds on attempt 0', async () => {
      let callCount = 0;
      const result = await callWithRetry(
        async () => {
          callCount++;
          return { success: true, text: 'Clean response' };
        },
        { operationName: 'Success Immediate' }
      );

      assert.equal(callCount, 1);
      assert.equal(result.success, true);
    });

    test('2. Retries on transient 503 error and succeeds on attempt 2', async () => {
      let callCount = 0;
      const retryEvents = [];

      const result = await callWithRetry(
        async (_model, attempt) => {
          callCount++;
          if (attempt === 0) {
            const err = new Error('503 UNAVAILABLE: Spikes in demand are usually temporary.');
            err.status = 503;
            throw err;
          }
          return { success: true, attempt };
        },
        {
          operationName: '503 Recovery',
          maxRetries: 3,
          baseDelay: 5,
          maxDelay: 15,
          onRetry: (evt) => retryEvents.push(evt),
        }
      );

      assert.equal(callCount, 2);
      assert.equal(result.success, true);
      assert.equal(retryEvents.length, 1);
      assert.equal(retryEvents[0].attempt, 0);
    });

    test('3. Retries on transient 429 rate limit and succeeds on attempt 3', async () => {
      let callCount = 0;

      const result = await callWithRetry(
        async (_model, attempt) => {
          callCount++;
          if (attempt < 2) {
            const err = new Error('429 RESOURCE_EXHAUSTED: Rate limit exceeded');
            err.status = 429;
            throw err;
          }
          return { recovered: true, callCount };
        },
        {
          operationName: '429 Recovery',
          maxRetries: 3,
          baseDelay: 5,
          maxDelay: 15,
        }
      );

      assert.equal(callCount, 3);
      assert.equal(result.recovered, true);
    });

    test('4. Immediately throws on permanent 401 without any retries (attempt = 1)', async () => {
      let callCount = 0;

      await assert.rejects(
        async () => {
          await callWithRetry(
            async () => {
              callCount++;
              const err = new Error('API key not valid. Please pass a valid API key.');
              err.status = 401;
              throw err;
            },
            {
              operationName: 'Permanent 401',
              maxRetries: 3,
              baseDelay: 5,
              maxDelay: 15,
            }
          );
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.ok(err.message.includes('API key not valid'));
          return true;
        }
      );

      // Must NOT have retried
      assert.equal(callCount, 1, 'Permanent error must never be retried');
    });

    test('5. Immediately throws on permanent 400 INVALID_ARGUMENT without retrying', async () => {
      let callCount = 0;

      await assert.rejects(
        async () => {
          await callWithRetry(
            async () => {
              callCount++;
              const err = new Error('INVALID_ARGUMENT: Bad request parameters');
              err.status = 400;
              throw err;
            },
            {
              operationName: 'Permanent 400',
              maxRetries: 3,
              baseDelay: 5,
              maxDelay: 15,
            }
          );
        },
        (err) => {
          assert.equal(err.status, 400);
          return true;
        }
      );

      assert.equal(callCount, 1, '400 must never be retried');
    });

    test('6. Automatically falls back to secondary model when primary exhausts retries', async () => {
      const modelsAttempted = [];

      const result = await callWithRetry(
        async (modelToUse) => {
          modelsAttempted.push(modelToUse);
          if (modelToUse === 'gemini-3.8-flash') {
            const err = new Error('503 UNAVAILABLE: High demand on gemini-3.8-flash');
            err.status = 503;
            throw err;
          }
          return { success: true, answeredBy: modelToUse };
        },
        {
          operationName: 'Model Fallback Test',
          primaryModel: 'gemini-3.8-flash',
          fallbackModel: 'gemini-3-flash-preview',
          maxRetries: 2,
          baseDelay: 5,
          maxDelay: 10,
        }
      );

      assert.equal(result.success, true);
      assert.equal(result.answeredBy, 'gemini-3-flash-preview');
      // gemini-3.8-flash was attempted 3 times (attempt 0, 1, 2), then gemini-3-flash-preview was called
      assert.ok(modelsAttempted.filter((m) => m === 'gemini-3.8-flash').length === 3);
      assert.ok(modelsAttempted.filter((m) => m === 'gemini-3-flash-preview').length === 1);
    });

    test('7. Exhausts all retries and fallback before throwing final transient error', async () => {
      let totalCalls = 0;

      await assert.rejects(
        async () => {
          await callWithRetry(
            async () => {
              totalCalls++;
              const err = new Error('503 UNAVAILABLE: Global outage');
              err.status = 503;
              throw err;
            },
            {
              operationName: 'All Retries Exhausted',
              primaryModel: 'gemini-3.8-flash',
              fallbackModel: 'gemini-3-flash-preview',
              maxRetries: 2,
              baseDelay: 5,
              maxDelay: 10,
            }
          );
        },
        (err) => {
          assert.equal(err.status, 503);
          return true;
        }
      );

      // Primary: 1 initial + 2 retries = 3 calls
      // Fallback: 1 initial + 1 retry = 2 calls
      assert.equal(totalCalls, 5);
    });
  });
});
