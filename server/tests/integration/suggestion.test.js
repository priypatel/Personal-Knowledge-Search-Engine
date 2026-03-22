import { jest } from '@jest/globals';
import request from 'supertest';

// ─── Mocks (must come before any dynamic imports) ────────────────────────────

jest.unstable_mockModule('../../src/config/db.js', () => ({
  query: jest.fn(),
  pool: { on: jest.fn() },
}));

jest.unstable_mockModule('../../src/config/env.js', () => ({
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  PORT: '5001',
  NODE_ENV: 'test',
  GROQ_API_KEY: 'test-key',
  DEEPSEEK_API_KEY: null,
  GEMINI_API_KEY: null,
}));

jest.unstable_mockModule('../../src/services/embedding.service.js', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(384).fill(0.1)),
  generateEmbeddings: jest.fn().mockResolvedValue([]),
  loadModel: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../../src/services/llm.service.js', () => ({
  llmChat: jest.fn().mockResolvedValue({ content: 'answer', provider: 'groq' }),
  getProviderStatus: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/suggestion.service.js', () => ({
  generateSuggestions: jest.fn().mockResolvedValue(['Q1?', 'Q2?', 'Q3?']),
}));

const mockGetDocumentById = jest.fn();
const mockGetSuggestionsByDocumentId = jest.fn();

jest.unstable_mockModule('../../src/repositories/document.repository.js', () => ({
  insertDocument: jest.fn().mockResolvedValue({ id: 1 }),
  updateDocumentStatus: jest.fn().mockResolvedValue(undefined),
  insertChunk: jest.fn().mockResolvedValue(undefined),
  insertSuggestion: jest.fn().mockResolvedValue(undefined),
  getDocumentById: mockGetDocumentById,
  getAllDocuments: jest.fn().mockResolvedValue([]),
  getSuggestionsByDocumentId: mockGetSuggestionsByDocumentId,
  getChunksByDocumentId: jest.fn().mockResolvedValue([]),
}));

// ─── App (loaded after mocks) ─────────────────────────────────────────────────

let app;

beforeAll(async () => {
  ({ default: app } = await import('../../src/app.js'));
});

beforeEach(() => {
  mockGetDocumentById.mockReset();
  mockGetSuggestionsByDocumentId.mockReset();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/suggestions', () => {
  test('returns 400 when documentId is missing', async () => {
    const res = await request(app).get('/api/suggestions');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when documentId is non-numeric', async () => {
    const res = await request(app).get('/api/suggestions?documentId=abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 404 when document does not exist', async () => {
    mockGetDocumentById.mockResolvedValue(null);

    const res = await request(app).get('/api/suggestions?documentId=999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 200 with suggestions array for valid documentId', async () => {
    mockGetDocumentById.mockResolvedValue({ id: 1, name: 'notes.pdf' });
    mockGetSuggestionsByDocumentId.mockResolvedValue([
      { id: 1, question: 'What is this about?' },
      { id: 2, question: 'What are the key takeaways?' },
    ]);

    const res = await request(app).get('/api/suggestions?documentId=1');

    expect(res.status).toBe(200);
    expect(res.body.documentId).toBe(1);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBe(2);
    expect(res.body.suggestions[0]).toHaveProperty('id');
    expect(res.body.suggestions[0]).toHaveProperty('question');
  });
});
