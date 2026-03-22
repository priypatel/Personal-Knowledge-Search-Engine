import { jest } from '@jest/globals';
import request from 'supertest';

// ─── Mocks (must come before any dynamic imports) ────────────────────────────

const mockDbQuery = jest.fn();

jest.unstable_mockModule('../../src/config/db.js', () => ({
  query: mockDbQuery,
  pool: { connect: jest.fn(), on: jest.fn() },
}));

jest.unstable_mockModule('../../src/config/env.js', () => ({
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  PORT: '5001',
  NODE_ENV: 'test',
  GROQ_API_KEY: 'test-key',
  DEEPSEEK_API_KEY: null,
  GEMINI_API_KEY: null,
}));

const mockGenerateEmbedding = jest.fn().mockResolvedValue(new Array(384).fill(0.1));

jest.unstable_mockModule('../../src/services/embedding.service.js', () => ({
  generateEmbedding: mockGenerateEmbedding,
  generateEmbeddings: jest.fn().mockResolvedValue([]),
  loadModel: jest.fn().mockResolvedValue(undefined),
}));

const mockLlmChat = jest.fn().mockResolvedValue({ content: 'Test answer.', provider: 'groq' });

jest.unstable_mockModule('../../src/services/llm.service.js', () => ({
  llmChat: mockLlmChat,
  getProviderStatus: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/suggestion.service.js', () => ({
  generateSuggestions: jest.fn().mockResolvedValue(['Q1?', 'Q2?', 'Q3?']),
}));

jest.unstable_mockModule('../../src/repositories/document.repository.js', () => ({
  insertDocument: jest.fn().mockResolvedValue({ id: 1 }),
  updateDocumentStatus: jest.fn().mockResolvedValue(undefined),
  insertChunk: jest.fn().mockResolvedValue(undefined),
  insertSuggestion: jest.fn().mockResolvedValue(undefined),
  getDocumentById: jest.fn().mockResolvedValue({ id: 1, name: 'test.pdf' }),
  getAllDocuments: jest.fn().mockResolvedValue([]),
  getSuggestionsByDocumentId: jest.fn().mockResolvedValue([]),
  getChunksByDocumentId: jest.fn().mockResolvedValue([]),
}));

// ─── App (loaded after mocks) ─────────────────────────────────────────────────

let app;

beforeAll(async () => {
  ({ default: app } = await import('../../src/app.js'));
});

beforeEach(() => {
  mockDbQuery.mockReset();
  mockDbQuery.mockResolvedValue({ rows: [] }); // default: no chunks
  mockGenerateEmbedding.mockReset();
  mockGenerateEmbedding.mockResolvedValue(new Array(384).fill(0.1));
  mockLlmChat.mockReset();
  mockLlmChat.mockResolvedValue({ content: 'Test answer.', provider: 'groq' });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  test('returns 400 when query is missing', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when query is empty string', async () => {
    const res = await request(app).post('/api/chat').send({ query: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 200 with "No relevant data found" when no chunks in DB', async () => {
    mockDbQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/chat').send({ query: 'What is this?' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toMatch(/No relevant data found/i);
    expect(res.body.sources).toEqual([]);
  });

  test('returns 200 with answer and sources when chunks exist', async () => {
    const chunkRow = { chunk_id: 1, document_id: 1, document_name: 'notes.pdf', content: 'Relevant passage.', chunk_index: 0, similarity: 0.9 };
    mockDbQuery.mockResolvedValueOnce({ rows: [chunkRow] });

    const res = await request(app).post('/api/chat').send({ query: 'What is this about?' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('answer', 'Test answer.');
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBe(1);
    expect(res.body.sources[0]).toHaveProperty('documentName', 'notes.pdf');
  });

  test('scopes search to documentId when provided', async () => {
    const chunkRow = { chunk_id: 2, document_id: 5, document_name: 'report.pdf', content: 'Specific content.', chunk_index: 0, similarity: 0.85 };
    mockDbQuery.mockResolvedValueOnce({ rows: [chunkRow] });

    const res = await request(app).post('/api/chat').send({ query: 'Tell me about this.', documentId: 5 });

    expect(res.status).toBe(200);
    const [, params] = mockDbQuery.mock.calls[0];
    expect(params[1]).toBe(5); // documentId passed as second SQL param
  });

  test('returns 503 when all LLM providers fail', async () => {
    const chunkRow = { chunk_id: 1, document_id: 1, document_name: 'doc.pdf', content: 'Some content.', chunk_index: 0, similarity: 0.8 };
    mockDbQuery.mockResolvedValueOnce({ rows: [chunkRow] });
    mockLlmChat.mockRejectedValue(new Error('All LLM providers failed'));

    const res = await request(app).post('/api/chat').send({ query: 'Tell me something.' });

    expect(res.status).toBe(503);
  });
});
