import { jest } from '@jest/globals';

const mockLlmChat = jest
  .fn()
  .mockResolvedValue({
    content: '["What is Knowbase?", "How does RAG work?", "What formats are supported?"]',
    provider: 'groq',
  });

jest.unstable_mockModule('../../../src/services/llm.service.js', () => ({
  llmChat: mockLlmChat,
  getProviderStatus: jest.fn(),
}));

let generateSuggestions;

beforeAll(async () => {
  ({ generateSuggestions } = await import(
    '../../../src/services/suggestion.service.js'
  ));
});

beforeEach(() => {
  mockLlmChat.mockClear();
});

describe('generateSuggestions', () => {
  test('returns an array of 3 strings', async () => {
    const result = await generateSuggestions('notes.pdf', 'This doc covers RAG.');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
  });

  test('each suggestion is a non-empty string', async () => {
    const result = await generateSuggestions('notes.pdf', 'This doc covers RAG.');
    result.forEach((q) => {
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(0);
    });
  });

  test('throws Suggestion generation failed when llmChat throws', async () => {
    mockLlmChat.mockRejectedValueOnce(new Error('All providers failed'));
    await expect(
      generateSuggestions('doc.txt', 'summary text')
    ).rejects.toThrow('Suggestion generation failed');
  });

  test('throws when llmChat returns invalid JSON', async () => {
    mockLlmChat.mockResolvedValueOnce({
      content: 'not valid json at all',
      provider: 'groq',
    });
    await expect(
      generateSuggestions('doc.txt', 'summary text')
    ).rejects.toThrow('Suggestion generation failed');
  });

  test('calls llmChat with messages containing system and user roles', async () => {
    await generateSuggestions('test.pdf', 'Some summary');
    expect(mockLlmChat).toHaveBeenCalledTimes(1);
    const [messages] = mockLlmChat.mock.calls[0];
    expect(Array.isArray(messages)).toBe(true);
    const roles = messages.map((m) => m.role);
    expect(roles).toContain('system');
    expect(roles).toContain('user');
  });
});
