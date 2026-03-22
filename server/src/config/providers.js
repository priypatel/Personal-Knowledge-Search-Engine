/**
 * Multi-provider LLM configuration.
 *
 * Priority order: Groq → DeepSeek → Gemini
 * Each provider is tried in order. On rate-limit (429) the provider is cooled
 * down for COOLDOWN_MS before being tried again. On other errors the provider
 * is skipped for the current request only.
 */

export const PROVIDER_PRIORITY = ['groq', 'deepseek', 'gemini'];

export const PROVIDER_MODELS = {
  groq: 'llama-3.1-8b-instant',
  deepseek: 'deepseek-chat',
  gemini: 'gemini-2.0-flash',
};

export const PROVIDER_RATE_LIMITS = {
  groq: { rpm: 30, rpd: 14400 },       // free tier
  deepseek: { rpm: 60, rpd: 200 },     // free tier (conservative)
  gemini: { rpm: 15, rpd: 1500 },      // free tier flash
};

/** Cooldown in ms after a provider returns 429 */
export const COOLDOWN_MS = 60_000;

/**
 * Returns true if the provider has an API key set in the environment.
 * @param {string} name
 */
export function isProviderConfigured(name) {
  const keyMap = {
    groq: process.env.GROQ_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  return Boolean(keyMap[name]);
}
