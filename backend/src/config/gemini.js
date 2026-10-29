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
 * Replaces the retired 'gemini-1.5-pro' with the supported 'gemini-3.8-flash' model.
 */
export const getGeminiModelName = () => {
  const envModel = process.env.GEMINI_MODEL;
  if (!envModel || envModel === 'gemini-1.5-pro' || envModel === 'gemini-1.5-flash' || envModel === 'gemini-2.5-flash') {
    return 'gemini-3.8-flash';
  }
  return envModel;
};

/**
 * Resolves the secondary fallback Gemini model name if the primary experiences high demand spikes (503/504).
 */
export const getGeminiFallbackModelName = () => {
  if (process.env.GEMINI_FALLBACK_MODEL) {
    return process.env.GEMINI_FALLBACK_MODEL;
  }
  const primary = getGeminiModelName();
  return primary === 'gemini-3.8-flash' ? 'gemini-3-flash-preview' : 'gemini-3.8-flash';
};
