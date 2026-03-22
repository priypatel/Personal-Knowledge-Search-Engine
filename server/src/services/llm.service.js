/**
 * LLM Service — multi-provider with automatic failover.
 *
 * Priority: Groq → DeepSeek → Gemini
 *
 * Switching rules:
 *   - 429 (rate limit): mark provider on 60s cooldown, try next
 *   - Other error: skip provider for this request, try next
 *   - All providers fail: throw Error
 *
 * Usage:
 *   import { llmChat } from './llm.service.js';
 *   const { content, provider } = await llmChat(messages, options);
 */

import logger from '../utils/logger.js';
import {
  PROVIDER_PRIORITY,
  PROVIDER_MODELS,
  COOLDOWN_MS,
  isProviderConfigured,
} from '../config/providers.js';

// In-memory cooldown state (resets on server restart)
const cooldowns = {};

function isCoolingDown(name) {
  const until = cooldowns[name];
  if (!until) return false;
  if (Date.now() >= until) {
    delete cooldowns[name];
    return false;
  }
  return true;
}

function setCooldown(name) {
  cooldowns[name] = Date.now() + COOLDOWN_MS;
  logger.warn(`LLM: ${name} rate-limited — cooldown until ${new Date(cooldowns[name]).toISOString()}`);
}

function isRateLimit(err) {
  return (
    err?.status === 429 ||
    err?.statusCode === 429 ||
    err?.message?.toLowerCase().includes('rate limit') ||
    err?.message?.toLowerCase().includes('quota')
  );
}

// ─── Provider callers ─────────────────────────────────────────────────────────

async function callGroq(messages, options) {
  const { default: Groq } = await import('groq-sdk');
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await client.chat.completions.create({
    model: options.model || PROVIDER_MODELS.groq,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  });
  return res.choices[0].message.content;
}

async function callDeepSeek(messages, options) {
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  });
  const res = await client.chat.completions.create({
    model: options.model || PROVIDER_MODELS.deepseek,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1024,
  });
  return res.choices[0].message.content;
}

async function callGemini(messages, options) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: options.model || PROVIDER_MODELS.gemini,
  });

  // Gemini uses a flat prompt — combine system + user messages
  const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
  const userMsg = messages.find((m) => m.role === 'user')?.content ?? '';
  const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

const CALLERS = {
  groq: callGroq,
  deepseek: callDeepSeek,
  gemini: callGemini,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a chat completion request using the best available provider.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [options]
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens]
 * @param {string} [options.model]  override model for the selected provider
 * @returns {Promise<{content: string, provider: string}>}
 */
export async function llmChat(messages, options = {}) {
  const candidates = PROVIDER_PRIORITY.filter(
    (p) => isProviderConfigured(p) && !isCoolingDown(p)
  );

  if (candidates.length === 0) {
    // All providers are either unconfigured or cooling down — log status
    const status = PROVIDER_PRIORITY.map(
      (p) => `${p}: ${!isProviderConfigured(p) ? 'not configured' : `cooldown until ${new Date(cooldowns[p]).toISOString()}`}`
    ).join(', ');
    throw new Error(`No LLM provider available. Status: ${status}`);
  }

  for (const name of candidates) {
    try {
      logger.info(`LLM: trying ${name}`);
      const content = await CALLERS[name](messages, options);
      logger.info(`LLM: success via ${name}`);
      return { content, provider: name };
    } catch (err) {
      if (isRateLimit(err)) {
        setCooldown(name);
      } else {
        logger.warn(`LLM: ${name} failed — ${err.message}`);
      }
    }
  }

  throw new Error('All configured LLM providers failed for this request');
}

/**
 * Returns which providers are currently active (not cooling down, configured).
 * Useful for health-check endpoints.
 */
export function getProviderStatus() {
  return PROVIDER_PRIORITY.map((name) => ({
    name,
    configured: isProviderConfigured(name),
    available: isProviderConfigured(name) && !isCoolingDown(name),
    cooldownUntil: cooldowns[name] ? new Date(cooldowns[name]).toISOString() : null,
  }));
}
