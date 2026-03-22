import dotenv from 'dotenv';
dotenv.config();

// Always required
const required = ['DATABASE_URL', 'PORT', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// At least one LLM provider key must be present
const llmKeys = ['GROQ_API_KEY', 'DEEPSEEK_API_KEY', 'GEMINI_API_KEY'];
const hasLLM = llmKeys.some((k) => Boolean(process.env[k]));
if (!hasLLM) {
  throw new Error(
    `At least one LLM API key is required: ${llmKeys.join(' | ')}`
  );
}

export const DATABASE_URL = process.env.DATABASE_URL;
export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET;

// LLM provider keys (any combination is valid — unused ones are null)
export const GROQ_API_KEY = process.env.GROQ_API_KEY || null;
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || null;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
