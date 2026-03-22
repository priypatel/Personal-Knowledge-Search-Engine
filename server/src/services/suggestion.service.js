import { llmChat } from './llm.service.js';
import logger from '../utils/logger.js';

/**
 * Generate 3 suggested questions for a document using the LLM.
 * @param {string} documentName
 * @param {string} summary - First ~1000 chars of document text
 * @returns {Promise<string[]>} Array of 3 question strings
 */
export async function generateSuggestions(documentName, summary) {
  const messages = [
    {
      role: 'system',
      content: 'You generate search questions from document summaries.',
    },
    {
      role: 'user',
      content: `Given this document summary, generate exactly 3 concise questions a user might ask. Return ONLY a JSON array of 3 strings, no explanation.\n\nDocument: ${documentName}\nSummary: ${summary}`,
    },
  ];

  try {
    const { content } = await llmChat(messages, { maxTokens: 256 });

    // Extract JSON array from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');

    const questions = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    return questions.slice(0, 3).map((q) => String(q));
  } catch (err) {
    logger.error(`Suggestion generation error: ${err.message}`);
    throw new Error('Suggestion generation failed');
  }
}
