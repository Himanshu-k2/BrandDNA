import { GoogleGenAI } from '@google/genai';

let geminiClient = null;

/**
 * Returns an initialized GoogleGenAI client if GEMINI_API_KEY is configured.
 * Returns null if the key is missing or not configured.
 */
export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: 30000 },
    });
  }

  return geminiClient;
};

/**
 * Checks whether the Gemini API key is configured.
 */
export const isGeminiConfigured = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('your_gemini_api_key'));
};

/**
 * Resolves the configured Gemini model name.
 * Defaults to Google AI Studio's 'gemini-3.6-flash'.
 */
export const getGeminiModelName = () => {
  const envModel = process.env.GEMINI_MODEL;
  if (envModel && envModel.trim() !== '' && !envModel.includes('2.5') && !envModel.includes('3.8')) {
    return envModel.trim();
  }
  return 'gemini-3.6-flash';
};

/**
 * Resolves the secondary fallback Gemini model name if the primary experiences high demand spikes (503/504).
 */
export const getGeminiFallbackModelName = () => {
  if (process.env.GEMINI_FALLBACK_MODEL && process.env.GEMINI_FALLBACK_MODEL.trim() !== '' && !process.env.GEMINI_FALLBACK_MODEL.includes('2.5')) {
    return process.env.GEMINI_FALLBACK_MODEL.trim();
  }
  return 'gemini-3.5-flash';
};
